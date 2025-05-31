
'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { analyzeImageOffers, type AnalyzeImageOffersOutput } from '@/ai/flows/analyze-image-offers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, FileImage, Wand2, AlertCircle, ShoppingBag, Search } from 'lucide-react';
import LoadingSpinner from './loading-spinner';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/lib/get-dictionary';

interface ImageAnalysisToolProps {
  dictionary: Dictionary['imageAnalysisTool'];
}

export default function ImageAnalysisTool({ dictionary }: ImageAnalysisToolProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageOffersOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(dictionary.errorSelectImage);
        setImagePreview(null);
        setImageDataUri(null);
        return;
      }
      setError(null); 

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!imageDataUri) {
      setError(dictionary.errorSelectImageFirst);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeImageOffers({ photoDataUri: imageDataUri });
      setAnalysisResult(result);
      toast({
        title: dictionary.analysisCompleteToastTitle,
        description: dictionary.analysisCompleteToastDesc.replace('{productIdentification}', result.productIdentification),
      });
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(dictionary.errorFailedAnalysis);
       toast({
        title: dictionary.analysisFailedToastTitle,
        description: dictionary.analysisFailedToastDesc,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Wand2 className="mr-2 h-7 w-7 text-primary" />
          {dictionary.title}
        </CardTitle>
        <CardDescription>
          {dictionary.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-foreground mb-1">
              {dictionary.uploadLabel}
            </label>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border px-6 pt-5 pb-6 hover:border-primary transition-colors">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-md overflow-hidden">
                    <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="contain" />
                  </div>
                ) : (
                  <>
                    <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground">
                      <span className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                        <span>{dictionary.uploadButton}</span>
                        <Input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                      </span>
                      <p className="pl-1">{dictionary.dragAndDrop}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{dictionary.fileTypes}</p>
                  </>
                )}
              </div>
            </div>
            {imagePreview && (
               <Button type="button" variant="link" className="mt-2 text-sm text-primary" onClick={() => {
                 setImagePreview(null);
                 setImageDataUri(null);
                 setAnalysisResult(null);
                 const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
                 if (fileInput) fileInput.value = ''; 
               }}>
                {dictionary.clearImage}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dictionary.errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoading || !imageDataUri}>
            {isLoading ? (
              <>
                <LoadingSpinner size={20} className="mr-2 text-primary-foreground" /> {dictionary.analyzingButton}
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-5 w-5" /> {dictionary.analyzeButton}
              </>
            )}
          </Button>
        </form>

        {analysisResult && (
          <div className="mt-8 space-y-6">
            <Alert variant="default" className="bg-secondary/10 border-secondary">
               <ShoppingBag className="h-5 w-5 text-secondary" />
              <AlertTitle className="text-secondary font-semibold">{dictionary.productIdentifiedTitle}</AlertTitle>
              <AlertDescription className="text-lg">
                {analysisResult.productIdentification}
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" className="w-full" onClick={() => alert('Offer search not implemented yet.')}>
              <Search className="mr-2 h-5 w-5" />
              {dictionary.searchOffersFor.replace('{productIdentification}', analysisResult.productIdentification)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
