class UserModel {
  final String id;
  final String username;
  final String email;
  final String role;
  final bool isApproved;

  UserModel({
    required this.id,
    required this.username,
    this.email = '',
    this.role = 'user',
    this.isApproved = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? json['username'] ?? '',
      role: json['role'] ?? 'user',
      isApproved: json['isApproved'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'role': role,
    'isApproved': isApproved,
  };
}
