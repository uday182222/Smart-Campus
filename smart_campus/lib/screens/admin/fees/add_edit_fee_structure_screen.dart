import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/fee_model.dart';

class AddEditFeeStructureScreen extends StatefulWidget {
  final FeeStructure? feeStructure;

  const AddEditFeeStructureScreen({super.key, this.feeStructure});

  @override
  State<AddEditFeeStructureScreen> createState() => _AddEditFeeStructureScreenState();
}

class _AddEditFeeStructureScreenState extends State<AddEditFeeStructureScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  FeeType _selectedType = FeeType.tuition;

  @override
  void initState() {
    super.initState();
    if (widget.feeStructure != null) {
      _nameController.text = widget.feeStructure!.name;
      _descriptionController.text = widget.feeStructure!.description;
      _amountController.text = widget.feeStructure!.amount.toString();
      _selectedType = widget.feeStructure!.type;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.feeStructure == null ? 'Add Fee Structure' : 'Edit Fee Structure'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Fee Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter fee name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  border: OutlineInputBorder(),
                  prefixText: '₹',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              DropdownButtonFormField<FeeType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Fee Type',
                  border: OutlineInputBorder(),
                ),
                items: FeeType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type.name.toUpperCase()),
                  );
                }).toList(),
                onChanged: (FeeType? type) {
                  setState(() {
                    _selectedType = type!;
                  });
                },
              ),
              const SizedBox(height: AppConstants.paddingLarge),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      // Save fee structure logic here
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(widget.feeStructure == null 
                              ? 'Fee structure added successfully' 
                              : 'Fee structure updated successfully'),
                          backgroundColor: Colors.green,
                        ),
                      );
                      Navigator.pop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    foregroundColor: AppConstants.textWhite,
                  ),
                  child: Text(widget.feeStructure == null ? 'Add Fee Structure' : 'Update Fee Structure'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
