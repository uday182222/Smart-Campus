import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
} from '@mui/material';
import {
  PhotoLibrary,
  Upload,
  Delete,
  Visibility,
  Download,
  Logout,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { galleryService, GalleryItem } from '../services/GalleryService';

const GalleryScreen: React.FC = () => {
  const { userData, logout } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    type: 'photo',
    caption: '',
    event: '',
    visibility: 'public' as 'public' | 'private' | 'class',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData?.schoolId) {
      loadGalleryItems();
    }
  }, [userData?.schoolId, page]);

  const loadGalleryItems = async () => {
    if (!userData?.schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await galleryService.getGalleryItems(userData.schoolId, {
        page,
        limit: 12,
      });
      if (result.success) {
        setItems(result.data.items);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Error loading gallery items:', err);
      setError(err.message || 'Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only images and videos are allowed.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userData?.schoolId) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const result = await galleryService.uploadItem(selectedFile, {
        ...uploadData,
        type: uploadData.type === 'photo' ? 'image' : 'video',
      });

      if (result.success) {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadData({
          type: 'photo',
          caption: '',
          event: '',
          visibility: 'public',
        });
        await loadGalleryItems();
      }
    } catch (err: any) {
      console.error('Error uploading:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const result = await galleryService.deleteItem(itemId);
      if (result.success) {
        await loadGalleryItems();
      }
    } catch (err: any) {
      console.error('Error deleting:', err);
      setError(err.message || 'Failed to delete item');
    }
  };

  if (loading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#3B82F6' }}>
        <Toolbar>
          <PhotoLibrary sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gallery
          </Typography>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Upload
          </Button>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" gutterBottom>
          Gallery ({items.length} items)
        </Typography>

        {items.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No gallery items found. Upload your first item!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {items.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.thumbnailUrl || item.url}
                      alt={item.caption || 'Gallery item'}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      {item.caption && (
                        <Typography variant="h6" gutterBottom>
                          {item.caption}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={item.type} size="small" />
                        <Chip label={item.visibility} size="small" variant="outlined" />
                        {item.event && <Chip label={item.event} size="small" color="primary" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Views: {item.views} • Downloads: {item.downloads}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          href={item.url}
                          target="_blank"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Download />}
                          href={item.url}
                          download
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Upload Gallery Item</Typography>
            <IconButton onClick={() => setUploadDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
            >
              {selectedFile ? selectedFile.name : 'Select File'}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Button>

            {selectedFile && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={uploadData.type}
                label="Type"
                onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
              >
                <MenuItem value="photo">Photo</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Caption (optional)"
              value={uploadData.caption}
              onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
            />

            <TextField
              fullWidth
              label="Event (optional)"
              value={uploadData.event}
              onChange={(e) => setUploadData({ ...uploadData, event: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={uploadData.visibility}
                label="Visibility"
                onChange={(e) => setUploadData({ ...uploadData, visibility: e.target.value as any })}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="class">Class</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GalleryScreen;

