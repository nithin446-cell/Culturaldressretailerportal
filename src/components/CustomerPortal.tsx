import { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, LogOut, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ProductCard } from './ProductCard';
import { Cart } from './Cart';
import { OrderTracking } from './OrderTracking';
import { ProfileEditor } from './ProfileEditor';
import { AnimatedBackground } from './AnimatedBackground';
import type { Product, CartItem, UserProfile } from '../types';
import { getProducts } from '../utils/api';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface CustomerPortalProps {
  accessToken: string;
  profile: UserProfile;
  onLogout: () => void;
}

export function CustomerPortal({ accessToken, profile, onLogout }: CustomerPortalProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'profile'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCart, setShowCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Saree', 'Kurti', 'Mysore Silk', 'Crepe Silk', 'Lehenga', 'Salwar Suit'];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setShowCart(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatedBackground variant="customer">
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl text-orange-600">Vastralaya</h1>
              <nav className="hidden md:flex space-x-4">
                <Button
                  variant={activeTab === 'shop' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('shop')}
                >
                  Shop
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('orders')}
                >
                  <Package className="size-4 mr-2" />
                  My Orders
                </Button>
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="size-4 mr-2" />
                  Profile
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                Welcome, {profile.name}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="size-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1.5 min-w-5 h-5">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="shop" className="flex-1">Shop</TabsTrigger>
                <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'shop' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for cultural dresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="text-center py-12">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No products found. Try adjusting your search or filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderTracking accessToken={accessToken} />
        )}

        {activeTab === 'profile' && (
          <ProfileEditor accessToken={accessToken} profile={profile} />
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl">Shopping Cart</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Cart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClose={() => setShowCart(false)}
                accessToken={accessToken}
                shippingAddress={profile.address}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </AnimatedBackground>
  );
}
