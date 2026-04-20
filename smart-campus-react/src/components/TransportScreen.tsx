import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DirectionsBus,
  LocationOn,
  Speed,
  Navigation,
  AccessTime,
  School,
  Logout,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { transportService, TransportRoute, LiveTrackingData } from '../services/TransportService';

const TransportScreen: React.FC = () => {
  const { userData, logout } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [liveTracking, setLiveTracking] = useState<LiveTrackingData | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  // Poll for live tracking updates when dialog is open
  useEffect(() => {
    if (!trackingDialogOpen || !selectedRoute) return;

    const interval = setInterval(() => {
      if (selectedRoute) {
        loadLiveTracking(selectedRoute.id);
      }
    }, 5000); // Update every 5 seconds

    // Load immediately
    loadLiveTracking(selectedRoute.id);

    return () => clearInterval(interval);
  }, [trackingDialogOpen, selectedRoute]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await transportService.getRoutes();
      if (result.success) {
        setRoutes(result.data.routes);
      }
    } catch (err: any) {
      console.error('Error loading routes:', err);
      setError(err.message || 'Failed to load transport routes');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveTracking = async (routeId: string) => {
    try {
      setTrackingLoading(true);
      const tracking = await transportService.getLiveTracking(routeId);
      setLiveTracking(tracking);
    } catch (err: any) {
      console.error('Error loading live tracking:', err);
      setError(err.message || 'Failed to load live tracking');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackLive = (route: TransportRoute) => {
    setSelectedRoute(route);
    setTrackingDialogOpen(true);
    loadLiveTracking(route.id);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
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
          <DirectionsBus sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Transport Management
          </Typography>
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Transport Routes
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadRoutes}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {routes.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                No transport routes found
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {routes.map((route) => (
              <Grid size={{ xs: 12, md: 6 }} key={route.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {route.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bus: {route.busNumber}
                        </Typography>
                        {route.helperName && (
                          <Typography variant="body2" color="text.secondary">
                            Helper: {route.helperName}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={route.status}
                        color={route.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <AccessTime sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        {route.startTime} - {route.endTime}
                      </Typography>
                      {route.latestLocation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                          Last update: {formatTime(route.latestLocation.timestamp)}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<LocationOn />}
                      onClick={() => handleTrackLive(route)}
                      sx={{ mt: 2 }}
                    >
                      Track Live
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Live Tracking Dialog */}
      <Dialog
        open={trackingDialogOpen}
        onClose={() => setTrackingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBus />
            <Typography variant="h6">
              {selectedRoute?.name} - Live Tracking
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {trackingLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!trackingLoading && liveTracking && (
            <Box>
              {liveTracking.latestLocation ? (
                <Card sx={{ mb: 3, backgroundColor: '#EFF6FF' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Location
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Latitude
                        </Typography>
                        <Typography variant="h6">
                          {liveTracking.latestLocation.latitude.toFixed(6)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Longitude
                        </Typography>
                        <Typography variant="h6">
                          {liveTracking.latestLocation.longitude.toFixed(6)}
                        </Typography>
                      </Grid>
                      {liveTracking.latestLocation.speed !== null && liveTracking.latestLocation.speed !== undefined && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            <Speed sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                            Speed
                          </Typography>
                          <Typography variant="h6">
                            {liveTracking.latestLocation.speed.toFixed(1)} km/h
                          </Typography>
                        </Grid>
                      )}
                      {liveTracking.latestLocation.heading !== null && liveTracking.latestLocation.heading !== undefined && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            <Navigation sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                            Heading
                          </Typography>
                          <Typography variant="h6">
                            {liveTracking.latestLocation.heading.toFixed(0)}°
                          </Typography>
                        </Grid>
                      )}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">
                          Last Update
                        </Typography>
                        <Typography variant="body1">
                          {formatTime(liveTracking.latestLocation.timestamp)}
                        </Typography>
                      </Grid>
                      {liveTracking.latestLocation.stopStatus && (
                        <Grid size={{ xs: 12 }}>
                          <Chip
                            label={`Stop: ${liveTracking.latestLocation.stopStatus.toUpperCase()}`}
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No live location data available for this route
                </Alert>
              )}

              {liveTracking.recentPath.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recent Path ({liveTracking.recentPath.length} points)
                  </Typography>
                  <List>
                    {liveTracking.recentPath.slice(0, 10).map((point, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={`Point ${index + 1}`}
                            secondary={
                              <>
                                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                                <br />
                                {formatTime(point.timestamp)}
                                {point.speed && ` • ${point.speed.toFixed(1)} km/h`}
                              </>
                            }
                          />
                        </ListItem>
                        {index < liveTracking.recentPath.length - 1 && index < 9 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportScreen;

