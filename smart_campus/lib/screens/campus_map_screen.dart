import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../core/constants/app_constants.dart';

class CampusMapScreen extends StatefulWidget {
  const CampusMapScreen({super.key});

  @override
  State<CampusMapScreen> createState() => _CampusMapScreenState();
}

class _CampusMapScreenState extends State<CampusMapScreen> {
  GoogleMapController? _mapController;
  final TextEditingController _searchController = TextEditingController();
  bool _isMapView = true;
  Position? _currentPosition;
  
  // Campus buildings data
  final List<Map<String, dynamic>> _buildings = [
    {
      'id': '1',
      'name': 'Main Library',
      'description': 'Academic Building A - Central library with study spaces',
      'category': 'Academic',
      'position': const LatLng(37.7749, -122.4194), // Example coordinates
      'icon': Icons.library_books,
      'color': Colors.blue,
      'facilities': ['Study Rooms', 'Computer Lab', 'Quiet Zones'],
      'operatingHours': '8:00 AM - 10:00 PM',
    },
    {
      'id': '2',
      'name': 'Student Center',
      'description': 'Recreation & Dining - Student hub and cafeteria',
      'category': 'Recreation',
      'position': const LatLng(37.7750, -122.4195),
      'icon': Icons.people,
      'color': Colors.green,
      'facilities': ['Cafeteria', 'Game Room', 'Meeting Spaces'],
      'operatingHours': '7:00 AM - 11:00 PM',
    },
    {
      'id': '3',
      'name': 'Science Lab',
      'description': 'Research Building B - Advanced science laboratories',
      'category': 'Research',
      'position': const LatLng(37.7748, -122.4193),
      'icon': Icons.science,
      'color': Colors.orange,
      'facilities': ['Chemistry Lab', 'Physics Lab', 'Biology Lab'],
      'operatingHours': '9:00 AM - 6:00 PM',
    },
    {
      'id': '4',
      'name': 'Sports Complex',
      'description': 'Athletic Center - Gymnasium and sports facilities',
      'category': 'Sports',
      'position': const LatLng(37.7751, -122.4196),
      'icon': Icons.sports_soccer,
      'color': Colors.red,
      'facilities': ['Gymnasium', 'Swimming Pool', 'Tennis Courts'],
      'operatingHours': '6:00 AM - 10:00 PM',
    },
    {
      'id': '5',
      'name': 'Administrative Building',
      'description': 'Main Office - Administrative and support services',
      'category': 'Administrative',
      'position': const LatLng(37.7747, -122.4192),
      'icon': Icons.business,
      'color': Colors.purple,
      'facilities': ['Student Services', 'Financial Aid', 'Registrar'],
      'operatingHours': '8:00 AM - 5:00 PM',
    },
  ];

  final Set<Marker> _markers = {};
  final Set<Polygon> _polygons = {};
  final Set<Polyline> _polylines = {};

  @override
  void initState() {
    super.initState();
    _initializeMap();
    _getCurrentLocation();
  }

  void _initializeMap() {
    _buildMarkers();
    _buildPolygons();
  }

  void _buildMarkers() {
    for (var building in _buildings) {
      _markers.add(
        Marker(
          markerId: MarkerId(building['id']),
          position: building['position'],
          infoWindow: InfoWindow(
            title: building['name'],
            snippet: building['description'],
            onTap: () => _showBuildingDetails(building),
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            _getMarkerHue(building['color']),
          ),
        ),
      );
    }
  }

  void _buildPolygons() {
    // Add campus boundary polygon
    _polygons.add(
      const Polygon(
        polygonId: PolygonId('campus_boundary'),
        points: [
          LatLng(37.7745, -122.4190),
          LatLng(37.7755, -122.4190),
          LatLng(37.7755, -122.4200),
          LatLng(37.7745, -122.4200),
        ],
        strokeWidth: 2,
        strokeColor: Colors.blue,
        fillColor: Color(0x1A2196F3),
      ),
    );
  }

  double _getMarkerHue(Color color) {
    if (color == Colors.blue) return BitmapDescriptor.hueBlue;
    if (color == Colors.green) return BitmapDescriptor.hueGreen;
    if (color == Colors.orange) return BitmapDescriptor.hueOrange;
    if (color == Colors.red) return BitmapDescriptor.hueRed;
    if (color == Colors.purple) return BitmapDescriptor.hueViolet;
    return BitmapDescriptor.hueAzure;
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = position;
      });

      if (_mapController != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(
            LatLng(position.latitude, position.longitude),
            15,
          ),
        );
      }
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  void _showBuildingDetails(Map<String, dynamic> building) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildBuildingDetailsSheet(building),
    );
  }

  Widget _buildBuildingDetailsSheet(Map<String, dynamic> building) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Building header
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: building['color'].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    building['icon'],
                    color: building['color'],
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        building['name'],
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        building['category'],
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Building details
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    building['description'],
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 20),
                  
                  // Facilities
                  const Text(
                    'Facilities',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: building['facilities'].map<Widget>((facility) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(facility),
                      );
                    }).toList(),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Operating hours
                  Row(
                    children: [
                      const Icon(Icons.access_time, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        'Operating Hours: ${building['operatingHours']}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            _navigateToBuilding(building);
                          },
                          icon: const Icon(Icons.directions),
                          label: const Text('Get Directions'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            _showBuildingInfo(building);
                          },
                          icon: const Icon(Icons.info),
                          label: const Text('More Info'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToBuilding(Map<String, dynamic> building) {
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(building['position'], 18),
      );
    }
    
    // Add navigation polyline from current location to building
    if (_currentPosition != null) {
      _polylines.clear();
      _polylines.add(
        Polyline(
          polylineId: const PolylineId('navigation_route'),
          points: [
            LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
            building['position'],
          ],
          color: Colors.blue,
          width: 3,
        ),
      );
      setState(() {});
    }
  }

  void _showBuildingInfo(Map<String, dynamic> building) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(building['name']),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(building['description']),
            const SizedBox(height: 16),
            Text('Category: ${building['category']}'),
            const SizedBox(height: 8),
            Text('Hours: ${building['operatingHours']}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _performSearch(String query) {
    if (query.isEmpty) {
      setState(() {
        _markers.clear();
        _buildMarkers();
      });
      return;
    }

    final filteredBuildings = _buildings.where((building) {
      return building['name'].toLowerCase().contains(query.toLowerCase()) ||
             building['description'].toLowerCase().contains(query.toLowerCase()) ||
             building['category'].toLowerCase().contains(query.toLowerCase());
    }).toList();

    setState(() {
      _markers.clear();
      for (var building in filteredBuildings) {
        _markers.add(
          Marker(
            markerId: MarkerId(building['id']),
            position: building['position'],
            infoWindow: InfoWindow(
              title: building['name'],
              snippet: building['description'],
              onTap: () => _showBuildingDetails(building),
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              _getMarkerHue(building['color']),
            ),
          ),
        );
      }
    });

    if (filteredBuildings.isNotEmpty && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(filteredBuildings.first['position'], 16),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Map'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: Icon(_isMapView ? Icons.list : Icons.map),
            onPressed: () {
              setState(() {
                _isMapView = !_isMapView;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search buildings, facilities...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _performSearch('');
                  },
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              onChanged: _performSearch,
            ),
          ),
          
          // Map or List view
          Expanded(
            child: _isMapView ? _buildMapView() : _buildListView(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _getCurrentLocation,
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        child: const Icon(Icons.my_location),
      ),
    );
  }

  Widget _buildMapView() {
    return GoogleMap(
      onMapCreated: (GoogleMapController controller) {
        _mapController = controller;
      },
      initialCameraPosition: const CameraPosition(
        target: LatLng(37.7749, -122.4194),
        zoom: 15,
      ),
      markers: _markers,
      polygons: _polygons,
      polylines: _polylines,
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      onTap: (LatLng position) {
        // Clear any existing navigation route
        setState(() {
          _polylines.clear();
        });
      },
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _buildings.length,
      itemBuilder: (context, index) {
        final building = _buildings[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: building['color'].withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                building['icon'],
                color: building['color'],
              ),
            ),
            title: Text(
              building['name'],
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(building['description']),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      building['operatingHours'],
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.arrow_forward_ios),
              onPressed: () => _showBuildingDetails(building),
            ),
            onTap: () => _showBuildingDetails(building),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
} 