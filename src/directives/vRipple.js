function ripple(ev) {
	const btn = ev.target.classList.contains('__ripple') ? ev.target : ev.target.closest('.__ripple')

	const rippleChild =  btn && btn.querySelector('.__ripple_child')
  const x = ev.layerX;
  const y = ev.layerY;
  const width = btn?.clientWidth

  rippleChild && rippleChild.style.setProperty("--x", `${x}px`);
  rippleChild && rippleChild.style.setProperty("--y", `${y}px`);
  rippleChild && rippleChild.style.setProperty("--btnWidth", `${width}px`);
  rippleChild && rippleChild && rippleChild.classList.add("__ripple_animation");

  setTimeout(() => {
    rippleChild && rippleChild.classList && rippleChild.classList.remove("__ripple_animation");
  }, 500);
}

export default {
	mounted: (el, {value}) => {
		if(value) {
			el.style.setProperty("--ripple-clr", value)
		}
		el.classList.add('__ripple')
		el.addEventListener("click", ripple);
		const div = document.createElement('div')
		div.classList.add('__ripple_child')
		el.appendChild(div)
	},
	unmounted: el => {
		el.removeEventListener("click", ripple);
	}
}