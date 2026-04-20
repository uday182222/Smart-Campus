import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const String _placeholderText = '''
By using the Smart Campus application, you agree to these Terms of Service. Please read them carefully. If you do not agree to these terms, do not use the application.

You must provide accurate and complete information when registering and keep your account credentials secure. You are responsible for all activity under your account. You may not share your account or use the service for any unlawful purpose or in violation of these terms.

The service is provided "as is" without warranties of any kind. We reserve the right to modify, suspend, or discontinue the service at any time. We may update these terms from time to time; continued use of the service after changes constitutes acceptance of the new terms.

We may terminate or restrict your access if you breach these terms. Upon termination, your right to use the service ceases immediately. For any questions regarding these terms, please contact us at support@smartcampus.com.
''';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Service'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Text(
          _placeholderText.trim(),
          style: TextStyle(
            fontSize: 16,
            height: 1.5,
            color: AppConstants.textPrimary,
          ),
        ),
      ),
    );
  }
}
