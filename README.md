# ⚡ Electric Field Simulation

Welcome to the Electric Field Simulator! This is a web-based interactive simulation built with **Three.js** that visualizes electric fields, charge interactions, and field lines in real-time. It's designed to be visually smooth, educational, and optimized for performance — even with many elements on screen.

## Features

* **Point Charge Visualization**
  Charges are rendered as colored glows (red for positive, blue for negative) with smooth falloff.

*  **Dynamic Electric Field Lines**
  Real-time field line tracing using numerical integration (e.g., RK4 or Euler) based on the current configuration of charges.

*  **Live Field Vectors**
  Small arrows show the direction and relative magnitude of the electric field at grid points.

*  **Charge Interaction**
  Drag-and-drop UI to add, move, or remove charges. Charges update the field in real-time.

*  **Performance Optimized Rendering**
  Uses GPU-accelerated shaders where possible. Minimizes expensive CPU calculations, batches geometry, and limits DOM overhead.

##  Tech Stack

* **Three.js** – Core 3D rendering and scene management.
* **GLSL Shaders** – Custom glow effects and maybe even some GPU-side field calculations.
* **JavaScript (ES6)** – Logic, controls, and UI interactions.
* **HTML/CSS** – Basic layout and style.

##  Physics Behind the Scenes

* Coulomb's Law:
  $\vec{E} = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i(\vec{r} - \vec{r}_i)}{|\vec{r} - \vec{r}_i|^3}$

* Field lines follow $\vec{E}$, traced via stepwise integration.

* No microcontrollers or external physics engines — all logic is in-browser and hand-coded for clarity and speed.

##  Future Plans

* Add equipotential surfaces/lines
* Implement field line animations
* Mobile support and UI polish
* Option to toggle between 2D and 3D modes

##  Try It Out

> Just clone and open `index.html` in a modern browser. No build steps needed (yet).

```bash
git clone https://github.com/your-username/electric-field-sim
cd electric-field-sim
# Open in browser or serve via localhost
```

## 📚 License

MIT License. Use it, fork it, improve it — just give credit where it’s due!
