# 🎨 ColorQuest — An Interactive Color Theory Game

> **Where creativity meets color theory!** 🌈
> Explore color relationships, experiment with color schemes, and transform images through an interactive color-by-number gaming experience.

---

## 📌 Project Overview

**ColorQuest** is an interactive color-theory game developed as part of a Color Theory Game Programming assignment.

The project brings the principles of color theory to life through an engaging, image-based experience. Players can explore different color models, experiment with color palettes, and interact with numbered image regions to discover how colors work together.

By combining visual design, color analysis, and interactive gameplay, ColorQuest aims to make learning about colors more engaging, intuitive, and enjoyable.

Whether you're interested in digital art, color combinations, or interactive applications, ColorQuest offers a creative way to explore the fascinating world of colors.

## 🎥 YouTube Video Demonstration

Curious to see ColorQuest in action? 🎨

Watch the video to discover the concept behind the game, explore its features, and see how color theory becomes an interactive experience!

[![Watch ColorQuest on YouTube](https://img.youtube.com/vi/eZYg2ipyQlA/maxresdefault.jpg)](https://youtu.be/eZYg2ipyQlA)

▶️ **[Watch the Full ColorQuest Demonstration on YouTube](https://youtu.be/eZYg2ipyQlA)**

## ✨ Key Features

* 🖼️ **Image Interaction:** Upload images or explore available preset images.
* 🎨 **Interactive Color Theory:** Experiment with color relationships and palettes.
* 🔴 **RGB Color Model:** Explore the additive color model used in digital displays.
* 🖨️ **CMYK Color Model:** Explore the subtractive color model associated with printing.
* 🌈 **Multiple Color Schemes:** Experiment with monochromatic, complementary, analogous, warm, and cool palettes.
* 🔢 **Numbered Image Regions:** Identify and interact with segmented regions of an image.
* 🖌️ **Color-by-Number Gameplay:** Select palette colors and fill the corresponding regions.
* 🔍 **Color Inspection:** Explore color properties, including hue, saturation, and value.
* 💡 **Hints and Mistake Tracking:** Receive gameplay assistance and track incorrect choices.
* ⏱️ **Timed Gameplay:** Add a time-based challenge to the experience.
* ↩️ **Undo Functionality:** Correct previous actions where supported.
* 🏆 **Victory Summary:** Review your results upon completing a game.
* 🔊 **Sound Effects:** Enhance the interactive experience with audio feedback.

## 🎮 How to Play

1. **Launch ColorQuest:** Open the application and enter the game.
2. **Choose an Image:** Upload an image or select an available preset.
3. **Select a Color Model:** Choose RGB or CMYK, depending on the available game options.
4. **Explore Color Schemes:** Select a palette style, such as monochromatic, complementary, or analogous.
5. **Inspect the Image:** Examine the numbered regions and available colors.
6. **Choose a Color:** Select a palette color that corresponds to the region you want to fill.
7. **Fill the Regions:** Interact with the image to apply the selected colors.
8. **Use Available Assistance:** Make use of hints and other supported gameplay features when needed.
9. **Complete the Challenge:** Finish the coloring objective and review your results.

The goal is to combine creativity with an understanding of color relationships while completing the interactive challenge.

## 🧠 Color Theory Concepts

### 🔴 RGB — Additive Color Model

RGB stands for **Red, Green, and Blue**.

It is an additive color model primarily used in digital displays. Different intensities of red, green, and blue light are combined to produce a wide range of colors. In the standard RGB model, combining all three channels at maximum intensity produces white.

### 🖨️ CMYK — Subtractive Color Model

CMYK stands for **Cyan, Magenta, Yellow, and Key (Black)**.

It is primarily associated with color printing. Unlike RGB, which combines light, CMYK uses inks that absorb portions of the light reflected from a surface.

Understanding the differences between these models helps explain why colors can appear differently across digital displays and printed materials.

### 🎨 HSV — Hue, Saturation, and Value

HSV describes colors using three properties:

* **Hue:** Represents the color's position around the color wheel.
* **Saturation:** Describes the intensity or purity of a color.
* **Value:** Represents the brightness of a color.

These properties provide an intuitive way to understand and inspect colors.

### 🌈 Color Schemes

ColorQuest explores five fundamental color schemes:

**1. Monochromatic**
Uses variations of a single hue to create a consistent and harmonious appearance.

**2. Complementary**
Combines colors positioned opposite one another on the color wheel, often producing strong contrast.

**3. Analogous**
Uses colors located near one another on the color wheel to create a cohesive visual palette.

**4. Warm Colors**
Explores colors commonly associated with warmth, such as reds, oranges, and yellows.

**5. Cool Colors**
Explores colors commonly associated with coolness, such as blues, greens, and blue-violets.

These schemes demonstrate how different color relationships influence visual harmony, contrast, and the overall appearance of an image.

## 🛠️ Technology Stack

ColorQuest is built using modern web-development technologies.

* **Frontend Framework:** React
* **Programming Language:** TypeScript
* **Build Tool and Development Server:** Vite
* **Styling:** Tailwind CSS tooling
* **Animations and Motion:** Motion
* **Icons:** Lucide React
* **Image Rendering and Interaction:** HTML Canvas
* **Testing:** Node.js test runner
* **Development Environment:** Google AI Studio and supporting development tools

The application combines a component-based interface with interactive image processing and color-related functionality.

## 🏗️ Project Structure

The project follows a modular structure that separates the user interface, game logic, and supporting resources.

```text
COLOR-QUEST-/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── TitleScreen.tsx
│   │   └── VictoryModal.tsx
│   └── game/
│       ├── colorMath.ts
│       ├── imageSegmentation.ts
│       └── rules.ts
├── tests/
├── public/
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── README.md
```

*Note: This is a simplified overview. Consult the repository for the complete directory structure and all available files.*

## 🚀 Getting Started

### Prerequisites

Before running the project locally, ensure that you have installed:

* [Node.js](https://nodejs.org/)
* npm, which is included with Node.js
* Git, if you want to clone the repository

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/DeveshMultani/COLOR-QUEST-.git
```

**2. Navigate to the project directory**

```bash
cd COLOR-QUEST-
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local address displayed in your terminal to access the application.

Available scripts and commands may vary according to the current `package.json`.

## 🎯 Project Objectives

ColorQuest was developed with the following objectives:

* Apply fundamental color-theory concepts in an interactive application.
* Explore the differences between RGB and CMYK color models.
* Demonstrate how color schemes influence visual composition.
* Combine image interaction with color-by-number gameplay.
* Create an engaging learning experience through game mechanics.
* Apply programming and interface-design concepts to a practical project.

## 🌟 The Idea Behind ColorQuest

Color is more than just appearance; it influences how we perceive, interpret, and experience visual information.

ColorQuest explores this idea by turning color selection into an interactive activity. Instead of only reading about color theory, players can experiment with palettes, observe visual differences, and apply their choices directly to an image.

The project brings together **art, logic, programming, and interactive learning** in one colorful experience.

## 🔗 Project Links

📺 **YouTube Video Demonstration**
https://youtu.be/eZYg2ipyQlA

💻 **GitHub Repository**
https://github.com/DeveshMultani/COLOR-QUEST-

📂 **Project Files and Resources**
https://drive.google.com/drive/folders/1gXXddKR3WIz4epP2Zx4RxFQghWymXpTt?usp=sharing

📸 **Instagram**
https://www.instagram.com/oyeeedevesh/

💼 **LinkedIn**
https://www.linkedin.com/in/devesh-multani-1b3a98427/

## 👨‍💻 Developer

**Devesh Multani**

Created as a project exploring the intersection of color theory, interactive game design, and web development.

## 💬 Feedback and Contributions

Thank you for exploring ColorQuest!

If you have suggestions, ideas, or feedback about the project, feel free to share your thoughts. Your feedback can help inspire future improvements and new creative possibilities.

**Explore colors. Experiment with creativity. Make every shade count.** 🎨🌈

---

*ColorQuest — A colorful journey through the science and art of colors.*
