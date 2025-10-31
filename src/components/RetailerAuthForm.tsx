import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AnimatedBackground } from './AnimatedBackground';
import { ShieldCheck } from 'lucide-react';

interface RetailerAuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function RetailerAuthForm({ onLogin }: RetailerAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground variant="retailer">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center">
            <ShieldCheck className="size-8 text-orange-600" />
          </div>
          <CardTitle className="text-3xl text-orange-600">Vastralaya Retailer</CardTitle>
          <CardDescription>Authorized Access Only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login to Retailer Portal'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              This portal is restricted to authorized retailers only.
              <br />
              Contact support if you need access.
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </AnimatedBackground>
  );
}
