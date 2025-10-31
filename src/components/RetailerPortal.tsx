import { useState, useEffect } from 'react';
import { Plus, Package, LogOut, Edit, Trash2, Key, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AddProductForm } from './AddProductForm';
import { OrderManagement } from './OrderManagement';
import { RetailerDashboard } from './RetailerDashboard';
import { AnimatedBackground } from './AnimatedBackground';
import type { Product, UserProfile } from '../types';
import { getRetailerProducts, deleteProduct } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface RetailerPortalProps {
  sessionToken: string;
  onLogout: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function RetailerPortal({ sessionToken, onLogout, onChangePassword }: RetailerPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getRetailerProducts(sessionToken);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProduct(sessionToken, productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleProductAdded = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === product.id ? product : p));
      toast.success('Product updated successfully');
    } else {
      setProducts([product, ...products]);
      toast.success('Product added successfully');
    }
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  return (
    <AnimatedBackground variant="retailer">
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl text-orange-600">Vastralaya Retailer</h1>
                <nav className="hidden md:flex space-x-4">
                  <Button
                    variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <BarChart3 className="size-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant={activeTab === 'products' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('products')}
                  >
                    <Package className="size-4 mr-2" />
                    My Products
                  </Button>
                  <Button
                    variant={activeTab === 'orders' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('orders')}
                  >
                    Orders
                  </Button>
                </nav>
              </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordDialog(true)}
                className="hidden sm:flex"
              >
                <Key className="size-4 mr-2" />
                Change Password
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <RetailerDashboard sessionToken={sessionToken} />
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">My Products ({products.length})</h2>
              <Button onClick={() => {
                setEditingProduct(null);
                setShowAddForm(true);
              }}>
                <Plus className="size-4 mr-2" />
                Add Product
              </Button>
            </div>

            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddProductForm
                    sessionToken={sessionToken}
                    onSuccess={handleProductAdded}
                    onCancel={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                    }}
                    initialProduct={editingProduct}
                  />
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="text-center py-12">Loading products...</div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="size-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No products yet</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="size-4 mr-2" />
                    Add Your First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="mb-2">{product.category}</Badge>
                      <h3 className="mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl text-orange-600">
                          ₹{product.price.toLocaleString()}
                        </span>
                        <span className="text-sm">
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="size-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="size-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderManagement sessionToken={sessionToken} />
        )}
      </main>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onChangePassword={onChangePassword}
      />
      </div>
    </AnimatedBackground>
  );
}