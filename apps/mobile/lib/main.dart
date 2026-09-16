import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Riverpod for state, no global mutable singletons (CLAUDE.md §10).
void main() {
  runApp(const ProviderScope(child: SchoolApp()));
}

class SchoolApp extends StatelessWidget {
  const SchoolApp({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: role-based routing (TEACHER vs PARENT), l10n delegate.
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('School')),
        body: const Center(
          child: Text('Phase 1 scaffold — Parent + Teacher mobile shell.'),
        ),
      ),
    );
  }
}
