
class RemarksService {
  static final RemarksService _instance = RemarksService._internal();
  factory RemarksService() => _instance;
  RemarksService._internal();

  // In-memory storage for remarks (in a real app, this would be a database)
  static final List<Map<String, dynamic>> _remarks = [];

  // Initialize with some mock data
  static void initializeMockData() {
    if (_remarks.isEmpty) {
      _remarks.addAll([
        {
          'id': '1',
          'studentId': '1',
          'studentName': 'John Doe',
          'className': 'Class 10A',
          'teacherName': 'Mrs. Sarah Johnson',
          'subject': 'Mathematics',
          'remarks': 'Excellent performance in algebra. Shows strong problem-solving skills and consistent effort.',
          'tags': ['Positive', 'Excellent'],
          'date': DateTime.now().subtract(const Duration(days: 2)),
        },
        {
          'id': '2',
          'studentId': '1',
          'studentName': 'John Doe',
          'className': 'Class 10A',
          'teacherName': 'Mr. David Wilson',
          'subject': 'Physics',
          'remarks': 'Good understanding of concepts but needs improvement in practical applications.',
          'tags': ['Good', 'Needs Improvement'],
          'date': DateTime.now().subtract(const Duration(days: 5)),
        },
        {
          'id': '3',
          'studentId': '2',
          'studentName': 'Jane Smith',
          'className': 'Class 10A',
          'teacherName': 'Ms. Emily Brown',
          'subject': 'English',
          'remarks': 'Outstanding writing skills and creative thinking. A pleasure to teach.',
          'tags': ['Positive', 'Excellent'],
          'date': DateTime.now().subtract(const Duration(days: 1)),
        },
        {
          'id': '4',
          'studentId': '2',
          'studentName': 'Jane Smith',
          'className': 'Class 10A',
          'teacherName': 'Dr. Michael Chen',
          'subject': 'Chemistry',
          'remarks': 'Shows interest in lab work but needs to focus more on theoretical concepts.',
          'tags': ['Good', 'Academic Concern'],
          'date': DateTime.now().subtract(const Duration(days: 3)),
        },
        {
          'id': '5',
          'studentId': '3',
          'studentName': 'Mike Johnson',
          'className': 'Class 9B',
          'teacherName': 'Mrs. Lisa Anderson',
          'subject': 'History',
          'remarks': 'Good participation in class discussions. Needs to improve essay writing skills.',
          'tags': ['Good', 'Needs Improvement'],
          'date': DateTime.now().subtract(const Duration(days: 4)),
        },
        {
          'id': '6',
          'studentId': '4',
          'studentName': 'Sarah Wilson',
          'className': 'Class 9B',
          'teacherName': 'Mr. Robert Davis',
          'subject': 'Biology',
          'remarks': 'Excellent lab work and understanding of concepts. Shows great potential.',
          'tags': ['Positive', 'Excellent'],
          'date': DateTime.now().subtract(const Duration(days: 6)),
        },
        {
          'id': '7',
          'studentId': '4',
          'studentName': 'David Wilson',
          'className': 'Class 8A',
          'teacherName': 'Current Teacher',
          'subject': 'General',
          'remarks': 'David shows excellent potential in mathematics. He consistently completes assignments on time and demonstrates strong problem-solving skills. However, he could benefit from more participation in class discussions.',
          'tags': ['Positive', 'Excellent', 'Needs Improvement'],
          'date': DateTime.now().subtract(const Duration(hours: 2)),
        },
      ]);
    }
  }

  // Add a new remark
  static Future<Map<String, dynamic>> addRemark({
    required String studentId,
    required String studentName,
    required String className,
    required String teacherName,
    required String subject,
    required String remarks,
    required List<String> tags,
  }) async {
    // Simulate API delay
    await Future.delayed(const Duration(milliseconds: 500));

    final newRemark = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'studentId': studentId,
      'studentName': studentName,
      'className': className,
      'teacherName': teacherName,
      'subject': subject,
      'remarks': remarks,
      'tags': tags,
      'date': DateTime.now(),
    };

    _remarks.add(newRemark);
    return newRemark;
  }

  // Get all remarks
  static List<Map<String, dynamic>> getAllRemarks() {
    return List.from(_remarks);
  }

  // Get remarks by class
  static List<Map<String, dynamic>> getRemarksByClass(String className) {
    return _remarks.where((remark) => remark['className'] == className).toList();
  }

  // Get remarks by student
  static List<Map<String, dynamic>> getRemarksByStudent(String studentId) {
    return _remarks.where((remark) => remark['studentId'] == studentId).toList();
  }

  // Get remarks by teacher
  static List<Map<String, dynamic>> getRemarksByTeacher(String teacherName) {
    return _remarks.where((remark) => remark['teacherName'] == teacherName).toList();
  }

  // Get remarks by date range
  static List<Map<String, dynamic>> getRemarksByDateRange(DateTime startDate, DateTime endDate) {
    return _remarks.where((remark) {
      final remarkDate = remark['date'] as DateTime;
      return remarkDate.isAfter(startDate.subtract(const Duration(days: 1))) && 
             remarkDate.isBefore(endDate.add(const Duration(days: 1)));
    }).toList();
  }

  // Search remarks by text
  static List<Map<String, dynamic>> searchRemarks(String searchText) {
    final lowercaseSearch = searchText.toLowerCase();
    return _remarks.where((remark) {
      return remark['studentName'].toString().toLowerCase().contains(lowercaseSearch) ||
             remark['remarks'].toString().toLowerCase().contains(lowercaseSearch) ||
             remark['subject'].toString().toLowerCase().contains(lowercaseSearch) ||
             remark['teacherName'].toString().toLowerCase().contains(lowercaseSearch);
    }).toList();
  }

  // Filter remarks by tags
  static List<Map<String, dynamic>> filterRemarksByTags(List<String> tags) {
    if (tags.isEmpty) return getAllRemarks();
    
    return _remarks.where((remark) {
      final remarkTags = List<String>.from(remark['tags']);
      return tags.any((tag) => remarkTags.contains(tag));
    }).toList();
  }

  // Update a remark
  static Future<bool> updateRemark(String remarkId, Map<String, dynamic> updates) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final index = _remarks.indexWhere((remark) => remark['id'] == remarkId);
    if (index != -1) {
      _remarks[index] = {..._remarks[index], ...updates};
      return true;
    }
    return false;
  }

  // Delete a remark
  static Future<bool> deleteRemark(String remarkId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final index = _remarks.indexWhere((remark) => remark['id'] == remarkId);
    if (index != -1) {
      _remarks.removeAt(index);
      return true;
    }
    return false;
  }

  // Get remarks statistics
  static Map<String, dynamic> getRemarksStatistics() {
    final totalRemarks = _remarks.length;
    final totalStudents = _remarks.map((r) => r['studentId']).toSet().length;
    final totalClasses = _remarks.map((r) => r['className']).toSet().length;
    
    // Count by tags
    final tagCounts = <String, int>{};
    for (final remark in _remarks) {
      final tags = List<String>.from(remark['tags']);
      for (final tag in tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    
    // Count by class
    final classCounts = <String, int>{};
    for (final remark in _remarks) {
      final className = remark['className'];
      classCounts[className] = (classCounts[className] ?? 0) + 1;
    }
    
    return {
      'totalRemarks': totalRemarks,
      'totalStudents': totalStudents,
      'totalClasses': totalClasses,
      'tagCounts': tagCounts,
      'classCounts': classCounts,
    };
  }

  // Clear all remarks (for testing purposes)
  static void clearAllRemarks() {
    _remarks.clear();
  }

  // Get recent remarks (last 10)
  static List<Map<String, dynamic>> getRecentRemarks({int limit = 10}) {
    final sortedRemarks = List<Map<String, dynamic>>.from(_remarks);
    sortedRemarks.sort((a, b) => (b['date'] as DateTime).compareTo(a['date'] as DateTime));
    return sortedRemarks.take(limit).toList();
  }
}
