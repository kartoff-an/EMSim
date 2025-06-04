# ⚡ Electric Field Simulation

This is a web-based interactive simulation built with **Three.js** that visualizes electric fields due to point charges, charge interactions, and field lines in real-time. It's designed to be visually smooth, and educational.

## Features

* **Point Charge Visualization**
  Charges can be rendered as colored glows (red for positive, blue for negative) with smooth falloff.

*  **Dynamic Electric Field Lines**
  Real-time field line tracing using Runge-Kutta method based on the current configuration of charges.

*  **Live Field Vectors**
  Small arrows show the direction of the electric field at grid points.

*  **Charge Interaction**
  Drag-and-drop UI to add, move, or remove charges. Charges update the field in real-time.

##  Tech Stack

* **Three.js** – Core 3D rendering and scene management.
* **JavaScript (ES6)** – Logic, controls, and UI interactions.
* **HTML/CSS** – Basic layout and style.

##  Physics Behind the Scenes

* Coulomb's Law:
  
  $\displaystyle \vec{E} = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i(\vec{r} - \vec{r}_i)}{|\vec{r} - \vec{r}_i|^3}$

* Field lines follow $\vec{E}$, traced via Runge-Kutta calculation of the differential equation
  
  $\displaystyle \frac{dy}{dx} = \frac{E_y}{E_x}$

##  Future Plans

* Add equipotential surfaces/lines
* Implement field line animations
* Mobile support and UI polish
* Option to toggle between 2D and 3D modes

##  Try It Out

> Just clone and open `index.html` in a modern browser. No build steps needed (yet).

```bash
git clone https://github.com/kartoff-an/EMSim
cd EMSim
npx vite
```

## 📚 License

**Apache License 2.0**. You’re free to use, modify, and distribute this project — even commercially — as long as you include proper attribution and state any changes. See the [LICENSE](./LICENSE) file for full details.
