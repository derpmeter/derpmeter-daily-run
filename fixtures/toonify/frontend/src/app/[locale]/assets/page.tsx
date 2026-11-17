'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Asset {
    id: string;
    filename: string;
    file_url: string;
    file_type: string;
    created_at: string;
}

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            await api.post('/assets', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Refresh list
            await fetchAssets();
        } catch (err) {
            console.error(err);
            toast({
                title: "Upload Failed",
                description: "Failed to upload asset. Please try again.",
                variant: 'destructive',
            });
            // alert("Failed to upload asset");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-8">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Assets Library</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your uploaded images and resources.</p>
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <Button onClick={handleUploadClick} disabled={uploading} className="gap-2">
                            {uploading ? (
                                <span>Uploading...</span>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Upload Asset
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                {loading ? (
                    <div>Loading assets...</div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <ImageIcon size={40} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No assets yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm text-center">
                            Upload images to use them in your projects.
                        </p>
                        <Button variant="outline" className="mt-6" onClick={handleUploadClick}>
                            Upload your first asset
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {assets.map(asset => (
                            <div key={asset.id} className="group relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 aspect-square">
                                <img
                                    src={asset.file_url}
                                    alt={asset.filename}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-white text-xs truncate mb-2">{asset.filename}</p>
                                    <div className="flex gap-2">
                                        {/* Placeholder for future actions */}
                                        <Button size="sm" variant="destructive" className="h-8 w-full text-xs">
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
