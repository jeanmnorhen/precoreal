
'use server';
/**
 * @fileOverview A flow to suggest commercially related products.
 *
 * - suggestRelatedProducts - A function that suggests related products.
 * - SuggestRelatedProductsInput - The input type for the suggestRelatedProducts function.
 * - SuggestRelatedProductsOutput - The return type for the suggestRelatedProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedProductsInputSchema = z.object({
  identifiedProductName: z.string().describe('The name of the product that was identified, for which related products should be suggested.'),
});
export type SuggestRelatedProductsInput = z.infer<typeof SuggestRelatedProductsInputSchema>;

const SuggestRelatedProductsOutputSchema = z.object({
  relatedProductNames: z.array(z.string()).describe('A list of commercially related product names, up to 5. These names should be suitable for use as search terms.'),
});
export type SuggestRelatedProductsOutput = z.infer<typeof SuggestRelatedProductsOutputSchema>;

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
    const {output} = await suggestRelatedProductsPrompt(input);
    return output!;
  }
);
