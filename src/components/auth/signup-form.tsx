
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/lib/get-dictionary';
import LoadingSpinner from '../loading-spinner';
import { useState } from 'react';

interface SignUpFormProps {
  lang: Locale;
  dictionary: Dictionary['authForms'];
}

export default function SignUpForm({ lang, dictionary }: SignUpFormProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signUpSchema = z.object({
    email: z.string().email({ message: dictionary.emailInvalidError }),
    password: z.string().min(6, { message: dictionary.passwordMinLengthError.replace('{length}', '6') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: dictionary.passwordsDontMatchError,
    path: ['confirmPassword'],
  });

  type SignUpFormValues = z.infer<typeof signUpSchema>;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: SignUpFormValues) {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
      toast({
        title: dictionary.signUpSuccessTitle,
        description: dictionary.signUpSuccessMessage,
      });
      router.push(`/${lang}/stores/register`); // Redirect to store registration or a dashboard
    } catch (error: any) {
      console.error('Sign up error:', error);
      const firebaseError = error.code ? dictionary.firebaseErrors[error.code as keyof typeof dictionary.firebaseErrors] || error.message : error.message;
      toast({
        title: dictionary.signUpErrorTitle,
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
          <UserPlus className="mr-2 h-7 w-7 text-primary" />
          {dictionary.signUpTitle}
        </CardTitle>
        <CardDescription>{dictionary.signUpDescription}</CardDescription>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dictionary.confirmPasswordLabel}
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
              {isLoading ? dictionary.signingUpButton : dictionary.signUpButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
