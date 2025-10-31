import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, X } from 'lucide-react';
import type { Product } from '../types';
import { addProduct, updateProduct, uploadImage } from '../utils/api';

interface AddProductFormProps {
  sessionToken: string;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
  initialProduct?: Product | null;
}

export function AddProductForm({ sessionToken, onSuccess, onCancel, initialProduct }: AddProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price?.toString() || '',
    category: initialProduct?.category || '',
    imageUrl: initialProduct?.imageUrl || '',
    stock: initialProduct?.stock?.toString() || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialProduct?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Saree',
    'Kurti',
    'Mysore Silk',
    'Crepe Silk',
    'Lehenga',
    'Salwar Suit',
    'Dupatta',
    'Blouse',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(selectedFile);
      setFormData({ ...formData, imageUrl });
      setPreviewUrl(imageUrl);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.price || !formData.category || !formData.imageUrl || !formData.stock) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedFile && !isUploading) {
      setError('Please upload the selected image first');
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl,
        stock: parseInt(formData.stock, 10),
      };

      let product;
      if (initialProduct) {
        product = await updateProduct(sessionToken, initialProduct.id, productData);
      } else {
        product = await addProduct(sessionToken, productData);
      }

      onSuccess(product);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Banarasi Silk Saree"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the product, materials, and features..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="2999"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Image *</Label>
        <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
          {previewUrl ? (
            <div className="relative">
              <div className="aspect-[3/4] max-w-xs overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setPreviewUrl('');
                  setFormData({ ...formData, imageUrl: '' });
                  setSelectedFile(null);
                }}
              >
                <X className="size-4 mr-1" />
                Remove Image
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="size-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Upload a product image</p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
            </div>
          )}
          
          {selectedFile && !formData.imageUrl && (
            <Button
              type="button"
              onClick={handleUploadImage}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Upload a high-quality image of the product (max 5MB)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || isUploading}>
          {isLoading ? 'Saving...' : initialProduct ? 'Update Product' : 'Add Product'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}