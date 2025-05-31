'use server';

/**
 * @fileOverview Image analysis flow to identify products in an image and find nearby offers.
 *
 * - analyzeImageOffers - A function that handles the image analysis and offer finding process.
 * - AnalyzeImageOffersInput - The input type for the analyzeImageOffers function.
 * - AnalyzeImageOffersOutput - The return type for the analyzeImageOffers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageOffersInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageOffersInput = z.infer<typeof AnalyzeImageOffersInputSchema>;

const AnalyzeImageOffersOutputSchema = z.object({
  productIdentification: z.string().describe('The identified product in the image.'),
  nearbyOffers: z.array(
    z.object({
      storeName: z.string().describe('The name of the store offering the product.'),
      price: z.number().describe('The price of the product at the store.'),
      distance: z.number().describe('The distance to the store from the user.'),
    })
  ).describe('A list of nearby offers for the identified product.'),
});
export type AnalyzeImageOffersOutput = z.infer<typeof AnalyzeImageOffersOutputSchema>;

export async function analyzeImageOffers(input: AnalyzeImageOffersInput): Promise<AnalyzeImageOffersOutput> {
  return analyzeImageOffersFlow(input);
}

const analyzeImageOffersPrompt = ai.definePrompt({
  name: 'analyzeImageOffersPrompt',
  input: {schema: AnalyzeImageOffersInputSchema},
  output: {schema: AnalyzeImageOffersOutputSchema},
  prompt: `You are an AI assistant designed to identify products in images and find nearby offers.

  Analyze the image provided and identify the product shown.  Then, find a list of nearby offers for that product, including the store name, price, and distance to the store.

  Image: {{media url=photoDataUri}}
  `,
});

const analyzeImageOffersFlow = ai.defineFlow(
  {
    name: 'analyzeImageOffersFlow',
    inputSchema: AnalyzeImageOffersInputSchema,
    outputSchema: AnalyzeImageOffersOutputSchema,
  },
  async input => {
    const {output} = await analyzeImageOffersPrompt(input);
    return output!;
  }
);
