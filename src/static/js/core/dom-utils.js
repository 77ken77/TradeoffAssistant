// DOM utility functions
export const $  = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
export const on = (el, ev, fn) => el.addEventListener(ev, fn);
export const delegate = (parent, ev, sel, fn) => {
  parent.addEventListener(ev, e => {
    if (e.target.matches(sel) || e.target.closest(sel)) fn(e);
  });
};
