"""Script to replace the crawl_and_extract_page method with enhanced version."""

# Read the original file
with open('app/services/page_crawl_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Read the enhanced method
with open('app/services/page_crawl_service_enhanced.py', 'r', encoding='utf-8') as f:
    enhanced_content = f.read()

# Extract just the method code (skip the docstring header and comments)
enhanced_lines = enhanced_content.split('\n')
method_start = 0
for i, line in enumerate(enhanced_lines):
    if line.strip().startswith('async def crawl_and_extract_page'):
        method_start = i
        break

# Get the method code
method_code = '\n'.join(enhanced_lines[method_start:])

# Now replace lines 127-307 (index 126-306 in 0-indexed) with the new method
# Line 128 is where the method starts, line 307 is "return False"
new_lines = lines[:127]  # Everything before the method (0-127)
new_lines.append('    ' + method_code.replace('\n', '\n    ') + '\n\n')  # Add proper indentation
new_lines.extend(lines[307:])  # Everything after the method (308+)

# Write the new file
with open('app/services/page_crawl_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Method replaced successfully!")
print(f"Original file: {len(lines)} lines")
print(f"New file: {len(new_lines)} lines")
