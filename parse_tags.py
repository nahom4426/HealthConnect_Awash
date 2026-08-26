import re

with open('src/features/motor/pages/MotorProposalDetail.vue', 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    if i > 770: break # stop at script
    
    # Simple regex to find <div and </div, ignoring self-closing
    divs_open = len(re.findall(r'<div\b[^>]*>', line))
    divs_close = len(re.findall(r'</div\b[^>]*>', line))
    
    for _ in range(divs_open): stack.append(i + 1)
    for _ in range(divs_close): 
        if stack: stack.pop()
        else: print(f"Unmatched closing tag at line {i+1}")

if stack:
    print(f"Unmatched opening tags at lines: {stack}")
else:
    print("All divs matched!")
