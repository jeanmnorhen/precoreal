
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase'; // Importar a instância do db
import { ref, get } from 'firebase/database'; // Importar as funções do database
import type { CanonicalProduct } from '@/types'; // Importar o tipo CanonicalProduct

const SuggestRelatedProductsInputSchema = z.object({
  identifiedProductName: z.string().describe('The name of the product that was identified, for which related products should be suggested.'),
});
export type SuggestRelatedProductsInput = z.infer<typeof SuggestRelatedProductsInputSchema>;

const SuggestRelatedProductsOutputSchema = z.object({
  relatedProductNames: z.array(z.string()).describe('A list of commercially related product names, up to 5. These names should be suitable for use as search terms.'),
});
export type SuggestRelatedProductsOutput = z.infer<typeof SuggestRelatedProductsOutputSchema>;

// Função para buscar produtos canônicos (adaptada de catalog-management page)
const getCanonicalProducts = async (): Promise<CanonicalProduct[]> => {
  try {
    const productsRef = ref(db, 'canonicalProducts');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      return Object.entries(productsData).map(([id, product]) => ({
        id,
        ...(product as Omit<CanonicalProduct, 'id'>),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching canonical products:", error);
    return [];
  }
};

export async function suggestRelatedProducts(input: SuggestRelatedProductsInput): Promise<SuggestRelatedProductsOutput> {
  return suggestRelatedProductsFlow(input);
}

const suggestRelatedProductsPrompt = ai.definePrompt({
  name: 'suggestRelatedProductsPrompt',
  input: {schema: SuggestRelatedProductsInputSchema},
  output: {schema: SuggestRelatedProductsOutputSchema},
  prompt: `You are an expert in retail and product association.
Given the product "{identifiedProductName}", suggest up to 5 commercially relevant products that a user might also be interested in purchasing.
These could be complementary products, accessories, or popular alternatives.
Focus on suggesting products that are likely to be in a retail catalog.
Provide only a list of product names. The names should be in English and concise, suitable for use as search terms.
Example Output: If the input is "smartphone", a good output might be ["screen protector", "phone case", "wireless earbuds", "power bank", "smartwatch"].
Identified Product: {{{identifiedProductName}}}
`,
});

const suggestRelatedProductsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedProductsFlow',
    inputSchema: SuggestRelatedProductsInputSchema,
    outputSchema: SuggestRelatedProductsOutputSchema,
  },
  async (input) => {
    // Buscar o catálogo de produtos
    const canonicalProducts = await getCanonicalProducts();
    const productNames = canonicalProducts.map(p => p.name);

    // Modificar o prompt para incluir a lista de produtos (opcional, pode ser refinado)
    // ou usar a lista para filtrar/validar as sugestões da IA
    const promptWithContext = `You are an expert in retail and product association.
Given the product "${input.identifiedProductName}", suggest up to 5 commercially relevant products that a user might also be interested in purchasing.
These could be complementary products, accessories, or popular alternatives.
Focus on suggesting products that are likely to be in a retail catalog.
Consider the following known products from the catalog (use them as inspiration, but don't be limited to them): ${productNames.join(', ')}
Provide only a list of product names. The names should be in English and concise, suitable for use as search terms.
Example Output: If the input is "smartphone", a good output might be ["screen protector", "phone case", "wireless earbuds", "power bank", "smartwatch"].
Identified Product: ${input.identifiedProductName}
`;

    const {output} = await ai.generate({ // Usar ai.generate diretamente
      model: ai.getModel('gemini-1.5-flash'), // Especificar o modelo, ajustar se necessário
      prompt: promptWithContext,
      output: {schema: SuggestRelatedProductsOutputSchema},
    });

    // Opcional: Adicionar lógica para filtrar sugestões da IA com base no catálogo real
    const filteredRelatedProductNames = output!.relatedProductNames.filter(suggestedName => 
        canonicalProducts.some(product => 
            product.name.toLowerCase() === suggestedName.toLowerCase()
        )
    );

    // Retornar sugestões filtradas ou as originais da IA se o filtro for muito restritivo
    return { relatedProductNames: filteredRelatedProductNames.length > 0 ? filteredRelatedProductNames : output!.relatedProductNames };
  }
);
