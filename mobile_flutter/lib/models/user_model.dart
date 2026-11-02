class UserModel {
  final String id;
  final String username;
  final String email;
  final String? displayName;
  final String role;
  final bool isApproved;
  final int freePasses;

  UserModel({
    required this.id,
    required this.username,
    this.email = '',
    this.displayName,
    this.role = 'user',
    this.isApproved = true,
    this.freePasses = 0,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? json['username'] ?? '',
      displayName: json['displayName'] ?? json['username'],
      role: json['role'] ?? 'user',
      isApproved: json['isApproved'] ?? true,
      freePasses: (json['freePasses'] is num) ? (json['freePasses'] as num).toInt() : 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'displayName': displayName,
    'role': role,
    'isApproved': isApproved,
    'freePasses': freePasses,
  };
}
