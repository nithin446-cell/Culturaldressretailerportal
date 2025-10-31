import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { UserProfile, Address } from '../types';
import { updateAddress } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface ProfileEditorProps {
  accessToken: string;
  profile: UserProfile;
}

export function ProfileEditor({ accessToken, profile }: ProfileEditorProps) {
  const [address, setAddress] = useState<Address>(profile.address || {
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    setIsLoading(true);
    try {
      await updateAddress(accessToken, address);
      toast.success('Address updated successfully!');
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast.error(error.message || 'Failed to update address');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl">My Profile</h2>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={profile.name} disabled />
          </div>
          <div>
            <Label>Account Type</Label>
            <Input value={profile.userType === 'customer' ? 'Customer' : 'Retailer'} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="Enter street address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                placeholder="Pincode"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Address'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
