
'use client';

import { useState, type ChangeEvent, type FormEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter
import type { Locale } from '@/i18n-config'; // Import Locale
import { analyzeImageOffers, type AnalyzeImageOffersOutput } from '@/ai/flows/analyze-image-offers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, FileImage, Wand2, AlertCircle, ShoppingBag, Search, Camera, Video, CameraOff } from 'lucide-react';
import LoadingSpinner from './loading-spinner';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/lib/get-dictionary';
import { cn } from '@/lib/utils';

interface ImageAnalysisToolProps {
  dictionary: Dictionary['imageAnalysisTool'];
  lang: Locale; // Add lang prop
}

export default function ImageAnalysisTool({ dictionary, lang }: ImageAnalysisToolProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageOffersOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // Cleanup stream on component unmount or when camera is closed
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const requestCameraPermission = async () => {
    if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
      setError(dictionary.cameraNotSupported);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: dictionary.cameraErrorTitle,
        description: dictionary.cameraNotSupported,
      });
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(dictionary.cameraAccessDeniedMessage);
      setHasCameraPermission(false);
      setIsCameraOpen(false);
      toast({
        variant: 'destructive',
        title: dictionary.cameraErrorTitle,
        description: dictionary.cameraAccessDeniedMessage,
      });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

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
      closeCamera();

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImageDataUri(dataUri);
        setImagePreview(dataUri);
      }
      closeCamera();
      setAnalysisResult(null); // Clear previous results
    }
  };
  
  const clearImageSelection = () => {
    setImagePreview(null);
    setImageDataUri(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    closeCamera();
  }

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

  const handleSearchOffers = () => {
    if (analysisResult?.productIdentification) {
      const searchTerm = encodeURIComponent(analysisResult.productIdentification);
      router.push(`/${lang}/?search=${searchTerm}`);
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
          <div className="space-y-4">
            {isCameraOpen && hasCameraPermission && (
              <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border bg-muted">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
            )}

            {imagePreview && !isCameraOpen && (
              <div className="relative w-full h-64 rounded-md overflow-hidden border border-border">
                <Image src={imagePreview} alt={dictionary.selectedImageAlt} layout="fill" objectFit="contain" />
              </div>
            )}

            {!imagePreview && !isCameraOpen && (
               <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border px-6 py-10 text-center hover:border-primary transition-colors">
                <div className="space-y-1">
                  <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <label htmlFor="imageUpload" className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                      <span>{dictionary.uploadButton}</span>
                      <Input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" ref={fileInputRef}/>
                    </label>
                    <p className="pl-1">{dictionary.dragAndDrop}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{dictionary.fileTypes}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {!isCameraOpen ? (
                 <Button type="button" variant="outline" className="flex-1" onClick={requestCameraPermission} disabled={hasCameraPermission === false}>
                   <Camera className="mr-2 h-5 w-5" />
                   {dictionary.openCameraButton}
                 </Button>
              ) : (
                <Button type="button" variant="outline" className="flex-1" onClick={closeCamera}>
                  <CameraOff className="mr-2 h-5 w-5" />
                  {dictionary.closeCameraButton}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className={cn("flex-1", { hidden: !isCameraOpen })}
                onClick={handleTakePhoto}
                disabled={!stream}
              >
                <Video className="mr-2 h-5 w-5" />
                {dictionary.takePhotoButton}
              </Button>
            </div>


            {imagePreview && (
               <Button type="button" variant="link" className="mt-2 text-sm text-primary p-0 h-auto" onClick={clearImageSelection}>
                {dictionary.clearImage}
              </Button>
            )}
          </div>
          
          {hasCameraPermission === false && !isCameraOpen && (
             <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dictionary.cameraErrorTitle}</AlertTitle>
              <AlertDescription>{dictionary.cameraPermissionWasDenied}</AlertDescription>
            </Alert>
          )}


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
            
            <Button variant="outline" className="w-full" onClick={handleSearchOffers}>
              <Search className="mr-2 h-5 w-5" />
              {dictionary.searchOffersFor.replace('{productIdentification}', analysisResult.productIdentification)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
