
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import LoadingSpinner from '../loading-spinner';
import { useState } from 'react';
import Link from 'next/link';

interface SignInFormProps {
  lang: Locale;
  dictionary: Dictionary['authForms'];
}

export default function SignInForm({ lang, dictionary }: SignInFormProps) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const signInSchema = z.object({
    email: z.string().email({ message: dictionary.emailInvalidError }),
    password: z.string().min(1, { message: dictionary.passwordRequiredError }),
  });

  type SignInFormValues = z.infer<typeof signInSchema>;

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignInFormValues) {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({
        title: dictionary.signInSuccessTitle,
        description: dictionary.signInSuccessMessage,
      });
      const redirectUrl = searchParams.get('redirect') || `/${lang}/stores/products`;
      router.push(redirectUrl);
    } catch (error: any) {
      console.error('Sign in error:', error);
      const firebaseError = error.code ? dictionary.firebaseErrors[error.code as keyof typeof dictionary.firebaseErrors] || error.message : error.message;
      toast({
        title: dictionary.signInErrorTitle,
        description: firebaseError,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <LogIn className="mr-2 h-7 w-7 text-primary" />
          {dictionary.signInTitle}
        </CardTitle>
        <CardDescription>{dictionary.signInDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dictionary.emailLabel}
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={dictionary.emailPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dictionary.passwordLabel}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size={20} className="mr-2"/> : null}
              {isLoading ? dictionary.signingInButton : dictionary.signInButton}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm">
          {dictionary.dontHaveAccount}{' '}
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href={`/${lang}/auth/signup`}>{dictionary.signUpLink}</Link>
          </Button>
        </p>
      </CardContent>
    </Card>
  );
}
