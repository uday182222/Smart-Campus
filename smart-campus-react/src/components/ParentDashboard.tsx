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
  Avatar,
  Chip,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  School,
  People,
  Assignment,
  Message,
  Notifications,
  AccountCircle,
  TrendingUp,
  MenuBook,
  EmojiEvents,
  DirectionsBus,
  AttachMoney,
  CalendarToday,
  Logout,
  PhotoLibrary,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parentService, ParentChild, ParentDashboardData } from '../services/ParentService';

const ParentDashboard: React.FC = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0 && children[selectedChildIndex]?.id) {
      loadDashboard(children[selectedChildIndex].id);
    }
  }, [selectedChildIndex, children.length]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await parentService.getChildren();
      if (result.success && result.data.children.length > 0) {
        setChildren(result.data.children);
      } else {
        setError('No children found. Please contact the school administrator.');
      }
    } catch (error: any) {
      console.error('❌ Error loading children:', error);
      setError(error.message || 'Failed to load children list.');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (studentId: string) => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await parentService.getDashboard(studentId);
      setDashboardData(data);
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      setError(error.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children[selectedChildIndex];
  const stats = dashboardData?.statistics;

  const dashboardStats = stats
    ? [
        {
          title: 'Children',
          value: String(children.length),
          subtitle: `${children.length} ${children.length === 1 ? 'child' : 'children'}`,
          icon: <People />,
          color: '#6366F1',
        },
        {
          title: 'Attendance',
          value: `${stats.attendance.attendancePercentage}%`,
          subtitle: `${stats.attendance.presentDays}/${stats.attendance.totalDays} days`,
          icon: <TrendingUp />,
          color: '#10B981',
        },
        {
          title: 'Homework',
          value: String(stats.homework.pending),
          subtitle: `${stats.homework.pending} pending`,
          icon: <MenuBook />,
          color: '#F59E0B',
        },
        {
          title: 'Marks',
          value: `${stats.marks.averagePercentage.toFixed(1)}%`,
          subtitle: `${stats.marks.passed}/${stats.marks.totalExams} passed`,
          icon: <EmojiEvents />,
          color: '#1E3A8A',
        },
      ]
    : [];

  if (loading && !dashboardData && children.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={<Button onClick={loadChildren}>Retry</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#3B82F6' }}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Campus - Parent Portal
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Notifications />
          </IconButton>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Hello, {userData?.name || 'Parent'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to your parent dashboard
          </Typography>
        </Box>

        {/* Child Selector */}
        {children.length > 1 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Child</InputLabel>
            <Select
              value={selectedChildIndex}
              label="Select Child"
              onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
            >
              {children.map((child, index) => (
                <MenuItem key={child.id} value={index}>
                  {child.name} - {child.school.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Selected Child Info */}
        {selectedChild && (
          <Card sx={{ mb: 4, backgroundColor: '#3B82F6', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  {selectedChild.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedChild.name}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {selectedChild.school.name} • {selectedChild.relationship}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardStats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        {dashboardData && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Notifications
                  </Typography>
                  <List>
                    {dashboardData.recentActivity.notifications.slice(0, 5).map((notif, index) => (
                      <React.Fragment key={notif.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: notif.type === 'alert' ? '#F59E0B' : '#3B82F6' }}>
                              <Notifications />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={notif.title}
                            secondary={notif.message}
                          />
                          <Chip
                            label={new Date(notif.createdAt).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </ListItem>
                        {index < 4 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<AttachMoney />} fullWidth>
                      View Fees
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<DirectionsBus />} 
                      fullWidth
                      onClick={() => navigate('/transport')}
                    >
                      Track Bus
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<PhotoLibrary />} 
                      fullWidth
                      onClick={() => navigate('/gallery')}
                    >
                      Gallery
                    </Button>
                    <Button variant="outlined" startIcon={<MenuBook />} fullWidth>
                      Homework
                    </Button>
                    <Button variant="outlined" startIcon={<Message />} fullWidth>
                      Messages
                    </Button>
                    <Button variant="outlined" startIcon={<CalendarToday />} fullWidth>
                      Calendar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ParentDashboard;

