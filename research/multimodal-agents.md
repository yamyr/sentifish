# Multimodal Agents: Vision, Image Analysis, and Cross-Modal Reasoning

## GPT-4o, Claude 3.5 Sonnet, Gemini, and the Rise of Agents That See

---

## Overview

Multimodal agents combine language understanding with visual perception, enabling AI systems to reason over images, screenshots, diagrams, PDFs, and video in addition to text. As of 2025, the three dominant foundation models — GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro — all support vision natively, and this capability is being integrated into coding agents, automation tools, and enterprise workflows. This file covers the architecture, capabilities, and applications of multimodal agents.

---

## 1. Vision Capability in Foundation Models (2025)

### GPT-4o

Released May 2024, GPT-4o ("omni") is OpenAI's flagship multimodal model:

**Vision capabilities:**
- Accepts JPEG, PNG, GIF, WebP images
- Max resolution: 1024×1024 per tile (for high-resolution images)
- Processes images as visual tokens (roughly 85-765 tokens per image depending on size)
- Understands charts, diagrams, handwriting, screenshots, photos
- Can compare multiple images in a single prompt
- Real-time vision via streaming API

**Token cost for images:**
```python
# Low detail (512x512 or smaller) - 85 tokens
# High detail - each 512x512 tile is 170 tokens + 85 base
# 1000x1000 image ≈ 765 tokens in high detail mode

import openai
client = openai.OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://example.com/chart.png",
                    "detail": "high"  # or "low" or "auto"
                }
            },
            {
                "type": "text",
                "text": "Describe the trend shown in this chart and extract all data points"
            }
        ]
    }]
)
```

**GPT-4o strengths:**
- Strong at reading text from images (OCR quality)
- Excellent at structured data extraction (tables, forms)
- Good spatial reasoning (object positions, relationships)
- Real-time audio+vision in multimodal streaming (GPT-4o Live API)

### Claude 3.5 Sonnet

Anthropic's Claude 3.5 Sonnet is widely regarded as the most capable model for coding and reasoning tasks with vision:

**Vision capabilities:**
- Accepts JPEG, PNG, GIF, WebP via base64 or URL
- Excellent at technical diagrams (architecture, UML, flowcharts)
- Strong code understanding from screenshots
- Superior at long document analysis with mixed text/images
- Native PDF understanding (with vision)

**API usage:**
```python
import anthropic
import base64

client = anthropic.Anthropic()

# Encode image as base64
with open("architecture_diagram.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": "Analyze this system architecture diagram. Identify potential single points of failure and suggest improvements."
            }
        ]
    }]
)
```

**Claude 3.5 Sonnet strengths:**
- Best-in-class at technical document understanding
- Superior reasoning about complex diagrams
- Long context + vision (200K tokens, with images counting against this)
- Computer use capability (clicking, scrolling, interacting with UIs)

### Gemini 1.5 Pro / 2.0 Flash

Google's Gemini models offer unique multimodal capabilities:

**Vision capabilities:**
- Native video understanding (not just images)
- Audio + vision + text in a single context
- Extremely long context (2M tokens with Gemini 1.5 Pro)
- Can process entire video files alongside text
- Google Lens integration for real-world scene understanding

**API usage:**
```python
import google.generativeai as genai

genai.configure(api_key="your-key")
model = genai.GenerativeModel('gemini-1.5-pro')

# Multi-image query
response = model.generate_content([
    "Compare these two architecture diagrams and identify the key differences:",
    genai.upload_file("architecture_v1.png", mime_type="image/png"),
    genai.upload_file("architecture_v2.png", mime_type="image/png"),
])

# Video understanding
video = genai.upload_file("demo.mp4", mime_type="video/mp4")
response = model.generate_content([
    video,
    "Describe what happens in this demo video and identify any bugs shown"
])
```

**Gemini strengths:**
- Only model with native video understanding
- Massive context window enables entire codebases + screenshots
- Strong at multi-image comparison
- Excellent integration with Google Workspace

---

## 2. Vision in Coding Agents

### Screenshot-Driven Debugging

Coding agents can now accept screenshots of errors or UIs and generate fixes:

**Example workflow:**
```
Developer takes screenshot of:
- Browser with visual layout bug
- Terminal showing stack trace
- IDE with red underlines on code

Agent receives screenshot + "Fix this"
Agent identifies:
- From browser: CSS flexbox alignment issue, line 234 of styles.css
- From terminal: NullPointerException in UserService.java:45
- From IDE: Type error, missing null check before .getName()

Agent generates specific fix for each
```

**Implementation with Claude 3.5 Sonnet:**
```python
def debug_from_screenshot(screenshot_path: str, context: str = "") -> str:
    """Send screenshot to Claude for debugging analysis"""
    with open(screenshot_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()
    
    prompt = f"""
    You are an expert debugger. Analyze this screenshot carefully.
    {f"Additional context: {context}" if context else ""}
    
    Please:
    1. Identify the exact error or issue
    2. Pinpoint the file and line number if visible
    3. Explain the root cause
    4. Provide a specific fix with code
    """
    
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_data}},
                {"type": "text", "text": prompt}
            ]
        }]
    )
    return response.content[0].text
```

### Diagram-to-Code

One of the highest-value applications: converting visual designs into working code.

**Figma/wireframe → React component:**
```
Input: Screenshot of Figma design (card component with avatar, title, description, CTA button)

Prompt: "Convert this Figma design to a React TypeScript component using Tailwind CSS"

Output:
interface CardProps {
  avatarUrl: string;
  title: string;
  description: string;
  onCtaClick: () => void;
}

export const Card: React.FC<CardProps> = ({ avatarUrl, title, description, onCtaClick }) => {
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-6 max-w-sm">
      <img src={avatarUrl} className="w-12 h-12 rounded-full mb-4" alt="avatar" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={onCtaClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Learn More
      </button>
    </div>
  );
};
```

**Database ERD → SQL schema:**
```
Input: ERD diagram showing Users, Orders, Products with relationships

Output:
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);
```

**Architecture diagram → Terraform/IaC:**
```
Input: AWS architecture diagram with VPC, load balancers, EC2 instances, RDS

Agent extracts:
- 2 availability zones
- Application Load Balancer
- 2 EC2 instances (t3.medium)
- RDS PostgreSQL (Multi-AZ)
- VPC with public/private subnets

Generates: Complete Terraform configuration
```

---

## 3. Computer Use Agents

Computer use is the most ambitious application of vision-capable agents — allowing agents to control computers by seeing the screen and sending mouse/keyboard input.

### Claude's Computer Use (2024)

Anthropic introduced Claude's "Computer Use" capability in October 2024:

**How it works:**
1. Agent takes a screenshot of the screen
2. Claude sees the screenshot and decides what action to take
3. System executes the action (click coordinates, type text, scroll)
4. Loop: take screenshot → decide → act → repeat

```python
import anthropic

client = anthropic.Anthropic()

# Computer use tool definitions
tools = [
    {
        "type": "computer_20241022",
        "name": "computer",
        "display_width_px": 1920,
        "display_height_px": 1080,
        "display_number": 1
    },
    {
        "type": "bash_20241022",
        "name": "bash"
    },
    {
        "type": "text_editor_20241022",
        "name": "str_replace_editor"
    }
]

response = client.beta.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "Open the browser, go to github.com/myrepo, and create a new issue titled 'Bug: Login page crashes on mobile'"
    }],
    betas=["computer-use-2024-10-22"]
)

# Process tool calls
for content_block in response.content:
    if content_block.type == "tool_use":
        if content_block.name == "computer":
            action = content_block.input['action']
            if action == 'screenshot':
                # Take screenshot and return to Claude
                pass
            elif action == 'left_click':
                x, y = content_block.input['coordinate']
                pyautogui.click(x, y)
            elif action == 'type':
                pyautogui.typewrite(content_block.input['text'])
```

### Browser-Use Framework

The `browser-use` Python library (100K+ GitHub stars by early 2025) makes vision-based browser automation accessible:

```python
from langchain_openai import ChatOpenAI
from browser_use import Agent

agent = Agent(
    task="Find the cheapest flight from Singapore to Tokyo in March 2025",
    llm=ChatOpenAI(model="gpt-4o"),
)

result = await agent.run()
print(result)
# Agent: Opened Google Flights → searched SIN to TYO → filtered March dates →
#        found cheapest option: Scoot on March 15, SGD 180 → returned result
```

**What browser-use handles:**
- Opens a Chromium browser via Playwright
- Takes screenshots at each step
- Sends screenshots + context to LLM
- LLM decides: click button, type text, scroll, navigate
- Extracts final result from page

### Vision Agent Loops

The core pattern for computer use agents:

```python
async def computer_use_loop(task: str, max_steps: int = 50):
    """Vision-based computer control agent loop"""
    messages = [{"role": "user", "content": task}]
    
    for step in range(max_steps):
        # 1. Take screenshot
        screenshot = capture_screen()
        
        # 2. Add screenshot to context
        messages.append({
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "data": screenshot}},
                {"type": "text", "text": "Current screen state. What action to take next?"}
            ]
        })
        
        # 3. Get agent decision
        response = claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            tools=COMPUTER_TOOLS,
            messages=messages
        )
        
        # 4. Execute action
        action = extract_action(response)
        if action['type'] == 'task_complete':
            return action['result']
        
        execute_computer_action(action)
        
        # 5. Record action in history
        messages.append({"role": "assistant", "content": response.content})
    
    return "Max steps reached"
```

---

## 4. Image Analysis Use Cases

### Document Processing

**Invoice/receipt extraction:**
```
Input: Photo of paper receipt
Output: {
  "merchant": "Starbucks Coffee",
  "date": "2024-03-15",
  "items": [
    {"name": "Venti Latte", "price": 6.50},
    {"name": "Blueberry Muffin", "price": 4.25}
  ],
  "subtotal": 10.75,
  "tax": 0.86,
  "total": 11.61,
  "payment_method": "Credit Card"
}
```

**Medical imaging analysis:**
```
Input: X-ray or MRI image
Agent: "I can see increased opacity in the lower right lobe of the lung,
        consistent with potential pneumonia. This should be reviewed by 
        a radiologist immediately. Key finding: areas at coordinates [400,350] 
        to [520,480] show abnormal density."
        
Note: Used as decision support, not diagnosis
```

**Document classification:**
```
Input: Scanned document
Agent: Identifies document type (contract, invoice, ID, letter),
       extracts key fields, routes to appropriate workflow
```

### Code Review from Screenshots

Agents can review code from screenshots (useful for code shared as images):

```
Input: Screenshot of Python code
Agent: "I can see several issues in this code:
        Line 15: SQL injection vulnerability — f-string with user input in query
        Line 23: Potential race condition — shared state accessed without lock
        Line 31: Missing error handling — network request without try/catch
        Line 45: Memory leak — file opened but never closed
        
        Here are the fixes: [provides corrected code]"
```

### Visual QA and Analysis

**Chart interpretation:**
```
Input: Bar chart of monthly sales data
Agent: "The chart shows:
        - Peak sales in December ($2.3M), likely holiday season
        - Significant dip in February ($0.8M) — lowest of the year
        - Consistent growth trend from July to December (+180%)
        - YoY comparison (where visible) shows 23% growth vs last year
        - Data extracted: [Jan: $1.1M, Feb: $0.8M, Mar: $1.2M, ...]"
```

**Comparison analysis:**
```
Input: Two screenshots (before/after UI change)
Agent: "Comparing the two screenshots:
        1. Button color changed from blue (#0044cc) to green (#00aa55)
        2. Font size increased for heading (16px → 20px)
        3. Navigation bar added (was missing in before screenshot)
        4. Whitespace increased around main content area (padding: 16px → 24px)
        5. New search icon added in top-right corner"
```

---

## 5. Multimodal Agent Architectures

### Vision-Language Action (VLA) Models

VLA models take image + language input and output actions:

```
Traditional:         Image → Vision Model → Description → LLM → Action
VLA:                 Image + Language → VLA Model → Action (directly)
```

Examples:
- **RT-2 (Google)** — Robot action from vision + language
- **OpenVLA** — Open-source VLA for robotics
- **SpatialBot** — Spatial understanding for embodied agents

### Tool-Using Vision Agents

Agents that use vision as one of many tools:

```python
tools = [
    Tool(name="screenshot", fn=take_screenshot),
    Tool(name="click", fn=click_coordinates),
    Tool(name="read_image", fn=analyze_image),
    Tool(name="extract_text", fn=ocr_image),
    Tool(name="compare_images", fn=image_diff),
    Tool(name="web_search", fn=search),
    Tool(name="run_code", fn=execute_python)
]

agent = ReActAgent(
    llm=gpt4o,
    tools=tools,
    system_prompt="""You are an agent that can see the screen and take actions.
                     Use the screenshot tool to see what's on screen,
                     then use click/type to interact."""
)
```

### Multimodal RAG

Extending RAG to support image retrieval alongside text:

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Store both text and image descriptions
def index_mixed_document(pdf_path: str):
    """Index PDF with both text and image content"""
    doc = fitz.open(pdf_path)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Extract text
        text = page.get_text()
        
        # Extract images and describe them
        for img_index, img in enumerate(page.get_images()):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_data = base_image["image"]
            
            # Get image description from vision model
            description = describe_image(image_data)
            
            # Store with metadata
            vectorstore.add_texts(
                texts=[description],
                metadatas=[{
                    "source": pdf_path,
                    "page": page_num,
                    "type": "image",
                    "img_index": img_index
                }]
            )
```

---

## 6. Screenshot Analysis in Agentic Systems

### Automated UI Testing

Agents that visually verify UI correctness:

```python
async def visual_regression_test(url: str, baseline_screenshot: str):
    """Use vision agent to compare current vs baseline UI"""
    
    # Take current screenshot
    current = await browser.screenshot(url)
    
    # Compare with Claude
    response = claude.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Compare these two screenshots and identify any visual differences, regressions, or broken UI elements:"},
                {"type": "image", "source": {"type": "base64", "data": baseline_screenshot}},
                {"type": "text", "text": "↑ Baseline (expected)   ↓ Current (to test)"},
                {"type": "image", "source": {"type": "base64", "data": current}}
            ]
        }]
    )
    
    return parse_visual_diff(response.content[0].text)
```

### Error Detection from Screenshots

```python
def detect_errors_in_screenshot(screenshot_base64: str) -> dict:
    """Detect UI errors from screenshot"""
    response = claude.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "data": screenshot_base64}},
                {"type": "text", "text": """
                    Analyze this screenshot for:
                    1. Error messages (modal dialogs, toast notifications, inline errors)
                    2. Broken layouts (overlapping elements, off-screen content)
                    3. Missing images (broken img tags)
                    4. Console-visible JavaScript errors
                    5. Loading spinners stuck
                    6. Empty states where content is expected
                    
                    Return JSON: {"errors": [...], "severity": "high|medium|low|none"}
                """}
            ]
        }]
    )
    return json.loads(response.content[0].text)
```

---

## 7. Multimodal Models Comparison (2025)

| Capability | GPT-4o | Claude 3.5 Sonnet | Gemini 1.5 Pro |
|------------|--------|-------------------|----------------|
| Image input | ✅ | ✅ | ✅ |
| Video input | ❌ (frames) | ❌ (frames) | ✅ Native |
| Audio input | ✅ Native | ❌ | ✅ Native |
| Computer use | Via API | ✅ Native beta | Via API |
| OCR quality | ★★★★★ | ★★★★☆ | ★★★★☆ |
| Diagram reasoning | ★★★★☆ | ★★★★★ | ★★★★☆ |
| Max images/call | 20 | 20 | 3000 (video frames) |
| Context window | 128K | 200K | 2M |
| Structured output | ✅ | ✅ | ✅ |
| Real-time streaming | ✅ | ✅ | ✅ |

---

## 8. Industry Applications

### E-commerce

- **Product image analysis** — extract attributes (color, size, material) from product photos
- **Visual search** — "find products similar to this image"
- **Moderation** — detect inappropriate product images
- **Defect detection** — manufacturing quality control via camera feeds

### Healthcare

- **Radiology assistance** — flag anomalies in X-rays, MRIs for radiologist review
- **Dermatology** — skin lesion classification (decision support)
- **Pathology** — slide analysis for cancer detection
- **Insurance claims** — photo verification of damage claims

### Software Development

- **Design-to-code** — Figma/Sketch screenshots to production components
- **Bug reports** — screenshot + description → reproducible bug report with fix
- **Code review** — whiteboard architecture photos → review and suggestions
- **Documentation** — screenshot UI → generate user documentation

### Legal and Finance

- **Contract review** — scanned contracts → extracted clauses and risk flags
- **Financial document processing** — statements, invoices, tax forms
- **Court document analysis** — filings, exhibits, case images

---

## 9. Challenges and Limitations

### Hallucination in Visual Reasoning

Models sometimes "see" things that aren't in the image:
- Fabricating data points in charts
- Misreading text (especially at low resolution)
- Incorrectly identifying objects or layouts

**Mitigation:** Always validate extracted structured data; use OCR tools as secondary verification

### Resolution and Quality Constraints

- Very small text in complex screenshots may be misread
- Low-contrast UI elements (light gray on white) are often missed
- Handwriting recognition quality varies significantly
- Photos of screens (rather than screenshots) degrade quality

### Context Window vs. Image Count

Each image consumes significant context tokens:
- GPT-4o: 765 tokens for a high-res screenshot
- 10 screenshots = ~7,650 tokens
- Limits how much history can be maintained in computer use loops

### Cost

Vision models cost more per call than text-only:
- GPT-4o vision: ~$5/M input tokens (images count as tokens)
- Claude 3.5 Sonnet: ~$3/M input tokens
- Processing 100 screenshots/day could cost $50-200/month

---

## 10. Future Directions (2025-2026)

### Real-Time Video Understanding

Gemini 2.0 and future models will process live video streams:
- **Live coding assistance** — agent watches you code in real-time
- **Meeting assistance** — agent sees shared screen during video calls
- **Robotic control** — continuous visual feedback loop for physical robots

### Native Computer Use

Dedicated computer control APIs are maturing:
- Claude Computer Use becoming production-ready
- OpenAI Operator (launched 2025) for web automation
- Windows Copilot+ native agent capabilities

### Multimodal Fine-Tuning

Organizations fine-tuning vision models on their specific visual domains:
- Medical imaging on domain-specific scans
- Manufacturing defect detection on proprietary data
- Document types (custom forms, industry-specific layouts)

---

## Conclusion

Multimodal capability is rapidly becoming table stakes for AI agents. The combination of powerful vision models (GPT-4o, Claude 3.5, Gemini) with agentic architectures is enabling entirely new categories of automation: diagram-to-code, computer use, visual debugging, and document processing. By 2026, the expectation will be that agents can "see" as well as "read" — handling any information format a human would encounter.

The key frontier is moving from per-image analysis to continuous visual understanding — agents that watch screens, monitor cameras, and process video streams as naturally as they process text today.

---

*Research compiled for Sentifish/Ajentik research archive, March 2025*
