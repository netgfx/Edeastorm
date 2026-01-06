import os

file_path = r'd:\work\Edeastorm\edeastorm\public\logo-icon.svg'

with open(file_path, 'r') as f:
    content = f.read()

# Define the gradient
gradient_def = '''
<defs>
<linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
<stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
</linearGradient>
</defs>
'''

# Insert gradient after the opening svg tag
# The opening tag ends with xml:space="preserve">
insert_point = 'xml:space="preserve">'
if insert_point in content:
    content = content.replace(insert_point, insert_point + '\n' + gradient_def)
else:
    print("Could not find insertion point for gradient defs")

# Replace fills
content = content.replace('fill="#000000"', 'fill="url(#logoGradient)"')

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully updated logo-icon.svg")
