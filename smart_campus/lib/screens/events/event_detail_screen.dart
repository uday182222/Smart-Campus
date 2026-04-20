import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';

class EventDetailScreen extends StatelessWidget {
  final Map<String, dynamic> event;

  const EventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(event['title'] as String? ?? 'Event'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Date', event['date'] as String? ?? '—'),
            if (event['time'] != null && (event['time'] as String).isNotEmpty) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              _buildDetailRow('Time', event['time'] as String? ?? '—'),
            ],
            const SizedBox(height: AppConstants.paddingMedium),
            const Text(
              'Description',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            Text(
              event['description'] as String? ?? 'No description',
              style: const TextStyle(
                color: AppConstants.textSecondary,
                height: 1.4,
              ),
            ),
            if (event['location'] != null && (event['location'] as String).isNotEmpty) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              _buildDetailRow('Location', event['location'] as String),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppConstants.textSecondary,
            ),
          ),
        ),
        Expanded(child: Text(value)),
      ],
    );
  }
}
