import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showActions?: boolean;
}

export function ProductCard({ product, onAddToCart, showActions = true }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <Badge className="mb-2">{product.category}</Badge>
        <h3 className="mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl text-orange-600">₹{product.price.toLocaleString()}</span>
          {product.stock > 0 ? (
            <span className="text-sm text-green-600">In Stock ({product.stock})</span>
          ) : (
            <span className="text-sm text-red-600">Out of Stock</span>
          )}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={() => onAddToCart?.(product)}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="size-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
