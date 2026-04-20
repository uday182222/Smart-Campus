import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/fee_model.dart';

class FeeDueDetailScreen extends StatelessWidget {
  final FeeDue feeDue;

  const FeeDueDetailScreen({super.key, required this.feeDue});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Due Details'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fee Due Details',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            Text('Student: ${feeDue.studentName}'),
            Text('Amount: ₹${feeDue.amount.toStringAsFixed(2)}'),
            Text('Due Date: ${feeDue.dueDate.day}/${feeDue.dueDate.month}/${feeDue.dueDate.year}'),
            Text('Status: ${feeDue.statusDisplayName}'),
          ],
        ),
      ),
    );
  }
}
