
'use server';

/**
 * @fileOverview Image analysis flow to identify products in an image.
 *
 * - analyzeImageOffers - A function that handles the image analysis.
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
  productIdentification: z.string().describe('The most specific identification of the product in the image. For example, "red t-shirt" or "iPhone 15 Pro".'),
});
export type AnalyzeImageOffersOutput = z.infer<typeof AnalyzeImageOffersOutputSchema>;

export async function analyzeImageOffers(input: AnalyzeImageOffersInput): Promise<AnalyzeImageOffersOutput> {
  return analyzeImageOffersFlow(input);
}

const analyzeImageOffersPrompt = ai.definePrompt({
  name: 'analyzeImageOffersPrompt',
  input: {schema: AnalyzeImageOffersInputSchema},
  output: {schema: AnalyzeImageOffersOutputSchema},
  prompt: `You are an AI assistant designed to identify products in images.
  Analyze the image provided and identify the main product shown.
  Provide a concise and specific identification of the product.

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
