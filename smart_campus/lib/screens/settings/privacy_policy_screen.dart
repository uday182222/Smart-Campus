import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const String _placeholderText = '''
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Smart Campus collects and uses your information to provide and improve the service. We may collect information you provide directly, such as when you create an account, and information collected automatically when you use our services.

We take the security of your personal data seriously and implement appropriate technical and organizational measures to protect it. Your data may be processed and stored on secure servers. We do not sell your personal information to third parties.

For questions about this privacy policy or our practices, please contact us through the app or at support@smartcampus.com. This policy may be updated from time to time; we will notify you of any material changes.
''';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
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
