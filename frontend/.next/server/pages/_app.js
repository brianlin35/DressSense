/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "__barrel_optimize__?names=Modal!=!./node_modules/react-bootstrap/esm/index.js":
/*!*************************************************************************************!*\
  !*** __barrel_optimize__?names=Modal!=!./node_modules/react-bootstrap/esm/index.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Modal: () => (/* reexport safe */ _Modal__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _Modal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Modal */ "./node_modules/react-bootstrap/esm/Modal.js");



/***/ }),

/***/ "./components/GlobalModal.js":
/*!***********************************!*\
  !*** ./components/GlobalModal.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ModalProvider: () => (/* binding */ ModalProvider),\n/* harmony export */   useModal: () => (/* binding */ useModal)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _barrel_optimize_names_Modal_react_bootstrap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! __barrel_optimize__?names=Modal!=!react-bootstrap */ \"__barrel_optimize__?names=Modal!=!./node_modules/react-bootstrap/esm/index.js\");\n// components/GlobalModal.js\n\n\n\nconst ModalContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nfunction ModalProvider({ children }) {\n    const [show, setShow] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [imageUrl, setImageUrl] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const openModal = (url)=>{\n        setImageUrl(url);\n        setShow(true);\n    };\n    const closeModal = ()=>{\n        setShow(false);\n        setImageUrl(\"\");\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(ModalContext.Provider, {\n        value: {\n            openModal,\n            closeModal\n        },\n        children: [\n            children,\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Modal_react_bootstrap__WEBPACK_IMPORTED_MODULE_2__.Modal, {\n                show: show,\n                onHide: closeModal,\n                centered: true,\n                size: \"lg\",\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Modal_react_bootstrap__WEBPACK_IMPORTED_MODULE_2__.Modal.Header, {\n                        closeButton: true,\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Modal_react_bootstrap__WEBPACK_IMPORTED_MODULE_2__.Modal.Title, {\n                            children: \"Image Preview\"\n                        }, void 0, false, {\n                            fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n                            lineNumber: 26,\n                            columnNumber: 11\n                        }, this)\n                    }, void 0, false, {\n                        fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n                        lineNumber: 25,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Modal_react_bootstrap__WEBPACK_IMPORTED_MODULE_2__.Modal.Body, {\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"img\", {\n                            src: imageUrl,\n                            alt: \"Preview\",\n                            style: {\n                                width: \"100%\",\n                                height: \"auto\",\n                                objectFit: \"contain\"\n                            }\n                        }, void 0, false, {\n                            fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n                            lineNumber: 29,\n                            columnNumber: 11\n                        }, this)\n                    }, void 0, false, {\n                        fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n                        lineNumber: 28,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n                lineNumber: 24,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/components/GlobalModal.js\",\n        lineNumber: 22,\n        columnNumber: 5\n    }, this);\n}\nfunction useModal() {\n    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(ModalContext);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL0dsb2JhbE1vZGFsLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw0QkFBNEI7O0FBQ3VDO0FBQzNCO0FBRXhDLE1BQU1LLDZCQUFlSixvREFBYUE7QUFFM0IsU0FBU0ssY0FBYyxFQUFFQyxRQUFRLEVBQUU7SUFDeEMsTUFBTSxDQUFDQyxNQUFNQyxRQUFRLEdBQUdQLCtDQUFRQSxDQUFDO0lBQ2pDLE1BQU0sQ0FBQ1EsVUFBVUMsWUFBWSxHQUFHVCwrQ0FBUUEsQ0FBQztJQUV6QyxNQUFNVSxZQUFZLENBQUNDO1FBQ2pCRixZQUFZRTtRQUNaSixRQUFRO0lBQ1Y7SUFFQSxNQUFNSyxhQUFhO1FBQ2pCTCxRQUFRO1FBQ1JFLFlBQVk7SUFDZDtJQUVBLHFCQUNFLDhEQUFDTixhQUFhVSxRQUFRO1FBQUNDLE9BQU87WUFBRUo7WUFBV0U7UUFBVzs7WUFDbkRQOzBCQUNELDhEQUFDSCwrRUFBS0E7Z0JBQUNJLE1BQU1BO2dCQUFNUyxRQUFRSDtnQkFBWUksUUFBUTtnQkFBQ0MsTUFBSzs7a0NBQ25ELDhEQUFDZiwrRUFBS0EsQ0FBQ2dCLE1BQU07d0JBQUNDLFdBQVc7a0NBQ3ZCLDRFQUFDakIsK0VBQUtBLENBQUNrQixLQUFLO3NDQUFDOzs7Ozs7Ozs7OztrQ0FFZiw4REFBQ2xCLCtFQUFLQSxDQUFDbUIsSUFBSTtrQ0FDVCw0RUFBQ0M7NEJBQ0NDLEtBQUtmOzRCQUNMZ0IsS0FBSTs0QkFDSkMsT0FBTztnQ0FBRUMsT0FBTztnQ0FBUUMsUUFBUTtnQ0FBUUMsV0FBVzs0QkFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNekU7QUFFTyxTQUFTQztJQUNkLE9BQU81QixpREFBVUEsQ0FBQ0U7QUFDcEIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kcmVzcy1zZW5zZS8uL2NvbXBvbmVudHMvR2xvYmFsTW9kYWwuanM/ZGJjOCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBjb21wb25lbnRzL0dsb2JhbE1vZGFsLmpzXG5pbXBvcnQgUmVhY3QsIHsgY3JlYXRlQ29udGV4dCwgdXNlU3RhdGUsIHVzZUNvbnRleHQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IE1vZGFsIH0gZnJvbSBcInJlYWN0LWJvb3RzdHJhcFwiO1xuXG5jb25zdCBNb2RhbENvbnRleHQgPSBjcmVhdGVDb250ZXh0KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBNb2RhbFByb3ZpZGVyKHsgY2hpbGRyZW4gfSkge1xuICBjb25zdCBbc2hvdywgc2V0U2hvd10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtpbWFnZVVybCwgc2V0SW1hZ2VVcmxdID0gdXNlU3RhdGUoXCJcIik7XG5cbiAgY29uc3Qgb3Blbk1vZGFsID0gKHVybCkgPT4ge1xuICAgIHNldEltYWdlVXJsKHVybCk7XG4gICAgc2V0U2hvdyh0cnVlKTtcbiAgfTtcblxuICBjb25zdCBjbG9zZU1vZGFsID0gKCkgPT4ge1xuICAgIHNldFNob3coZmFsc2UpO1xuICAgIHNldEltYWdlVXJsKFwiXCIpO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPE1vZGFsQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyBvcGVuTW9kYWwsIGNsb3NlTW9kYWwgfX0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgICA8TW9kYWwgc2hvdz17c2hvd30gb25IaWRlPXtjbG9zZU1vZGFsfSBjZW50ZXJlZCBzaXplPVwibGdcIj5cbiAgICAgICAgPE1vZGFsLkhlYWRlciBjbG9zZUJ1dHRvbj5cbiAgICAgICAgICA8TW9kYWwuVGl0bGU+SW1hZ2UgUHJldmlldzwvTW9kYWwuVGl0bGU+XG4gICAgICAgIDwvTW9kYWwuSGVhZGVyPlxuICAgICAgICA8TW9kYWwuQm9keT5cbiAgICAgICAgICA8aW1nXG4gICAgICAgICAgICBzcmM9e2ltYWdlVXJsfVxuICAgICAgICAgICAgYWx0PVwiUHJldmlld1wiXG4gICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogXCIxMDAlXCIsIGhlaWdodDogXCJhdXRvXCIsIG9iamVjdEZpdDogXCJjb250YWluXCIgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L01vZGFsLkJvZHk+XG4gICAgICA8L01vZGFsPlxuICAgIDwvTW9kYWxDb250ZXh0LlByb3ZpZGVyPlxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlTW9kYWwoKSB7XG4gIHJldHVybiB1c2VDb250ZXh0KE1vZGFsQ29udGV4dCk7XG59Il0sIm5hbWVzIjpbIlJlYWN0IiwiY3JlYXRlQ29udGV4dCIsInVzZVN0YXRlIiwidXNlQ29udGV4dCIsIk1vZGFsIiwiTW9kYWxDb250ZXh0IiwiTW9kYWxQcm92aWRlciIsImNoaWxkcmVuIiwic2hvdyIsInNldFNob3ciLCJpbWFnZVVybCIsInNldEltYWdlVXJsIiwib3Blbk1vZGFsIiwidXJsIiwiY2xvc2VNb2RhbCIsIlByb3ZpZGVyIiwidmFsdWUiLCJvbkhpZGUiLCJjZW50ZXJlZCIsInNpemUiLCJIZWFkZXIiLCJjbG9zZUJ1dHRvbiIsIlRpdGxlIiwiQm9keSIsImltZyIsInNyYyIsImFsdCIsInN0eWxlIiwid2lkdGgiLCJoZWlnaHQiLCJvYmplY3RGaXQiLCJ1c2VNb2RhbCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./components/GlobalModal.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! slick-carousel/slick/slick.css */ \"./node_modules/slick-carousel/slick/slick.css\");\n/* harmony import */ var slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! slick-carousel/slick/slick-theme.css */ \"./node_modules/slick-carousel/slick/slick-theme.css\");\n/* harmony import */ var slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var bootstrap_dist_css_bootstrap_min_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! bootstrap/dist/css/bootstrap.min.css */ \"./node_modules/bootstrap/dist/css/bootstrap.min.css\");\n/* harmony import */ var bootstrap_dist_css_bootstrap_min_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(bootstrap_dist_css_bootstrap_min_css__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _components_GlobalModal__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/GlobalModal */ \"./components/GlobalModal.js\");\n// pages/_app.js\n\n\n\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    const [darkMode, setDarkMode] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const toggleDarkMode = ()=>setDarkMode((prev)=>!prev);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (darkMode) {\n            document.body.classList.add(\"dark-mode\");\n        } else {\n            document.body.classList.remove(\"dark-mode\");\n        }\n    }, [\n        darkMode\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_GlobalModal__WEBPACK_IMPORTED_MODULE_6__.ModalProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps,\n            darkMode: darkMode,\n            toggleDarkMode: toggleDarkMode\n        }, void 0, false, {\n            fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/pages/_app.js\",\n            lineNumber: 23,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/jorgesandoval/Desktop/Coding/Berkeley/DATASCI210/Web Dashboard/frontend/pages/_app.js\",\n        lineNumber: 22,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0JBQWdCOztBQUNtQztBQUNYO0FBQ007QUFDQTtBQUNmO0FBQzJCO0FBRTFELFNBQVNJLE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDckMsTUFBTSxDQUFDQyxVQUFVQyxZQUFZLEdBQUdQLCtDQUFRQSxDQUFDO0lBQ3pDLE1BQU1RLGlCQUFpQixJQUFNRCxZQUFZRSxDQUFBQSxPQUFRLENBQUNBO0lBRWxEUixnREFBU0EsQ0FBQztRQUNSLElBQUlLLFVBQVU7WUFDWkksU0FBU0MsSUFBSSxDQUFDQyxTQUFTLENBQUNDLEdBQUcsQ0FBQztRQUM5QixPQUFPO1lBQ0xILFNBQVNDLElBQUksQ0FBQ0MsU0FBUyxDQUFDRSxNQUFNLENBQUM7UUFDakM7SUFDRixHQUFHO1FBQUNSO0tBQVM7SUFFYixxQkFDRSw4REFBQ0osa0VBQWFBO2tCQUNaLDRFQUFDRTtZQUFXLEdBQUdDLFNBQVM7WUFBRUMsVUFBVUE7WUFBVUUsZ0JBQWdCQTs7Ozs7Ozs7Ozs7QUFHcEU7QUFFQSxpRUFBZUwsS0FBS0EsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2RyZXNzLXNlbnNlLy4vcGFnZXMvX2FwcC5qcz9lMGFkIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHBhZ2VzL19hcHAuanNcbmltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFwic2xpY2stY2Fyb3VzZWwvc2xpY2svc2xpY2suY3NzXCI7IFxuaW1wb3J0IFwic2xpY2stY2Fyb3VzZWwvc2xpY2svc2xpY2stdGhlbWUuY3NzXCI7XG5pbXBvcnQgJ2Jvb3RzdHJhcC9kaXN0L2Nzcy9ib290c3RyYXAubWluLmNzcyc7XG5pbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWxzLmNzcyc7XG5pbXBvcnQgeyBNb2RhbFByb3ZpZGVyIH0gZnJvbSAnLi4vY29tcG9uZW50cy9HbG9iYWxNb2RhbCc7XG5cbmZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xuICBjb25zdCBbZGFya01vZGUsIHNldERhcmtNb2RlXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgdG9nZ2xlRGFya01vZGUgPSAoKSA9PiBzZXREYXJrTW9kZShwcmV2ID0+ICFwcmV2KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkYXJrTW9kZSkge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdkYXJrLW1vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdkYXJrLW1vZGUnKTtcbiAgICB9XG4gIH0sIFtkYXJrTW9kZV0pO1xuXG4gIHJldHVybiAoXG4gICAgPE1vZGFsUHJvdmlkZXI+XG4gICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IGRhcmtNb2RlPXtkYXJrTW9kZX0gdG9nZ2xlRGFya01vZGU9e3RvZ2dsZURhcmtNb2RlfSAvPlxuICAgIDwvTW9kYWxQcm92aWRlcj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlBcHA7XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsIk1vZGFsUHJvdmlkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImRhcmtNb2RlIiwic2V0RGFya01vZGUiLCJ0b2dnbGVEYXJrTW9kZSIsInByZXYiLCJkb2N1bWVudCIsImJvZHkiLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "@restart/hooks/useCallbackRef":
/*!************************************************!*\
  !*** external "@restart/hooks/useCallbackRef" ***!
  \************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/hooks/useCallbackRef");

/***/ }),

/***/ "@restart/hooks/useEventCallback":
/*!**************************************************!*\
  !*** external "@restart/hooks/useEventCallback" ***!
  \**************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/hooks/useEventCallback");

/***/ }),

/***/ "@restart/hooks/useMergedRefs":
/*!***********************************************!*\
  !*** external "@restart/hooks/useMergedRefs" ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/hooks/useMergedRefs");

/***/ }),

/***/ "@restart/hooks/useWillUnmount":
/*!************************************************!*\
  !*** external "@restart/hooks/useWillUnmount" ***!
  \************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/hooks/useWillUnmount");

/***/ }),

/***/ "@restart/ui/Modal":
/*!************************************!*\
  !*** external "@restart/ui/Modal" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/ui/Modal");

/***/ }),

/***/ "@restart/ui/ModalManager":
/*!*******************************************!*\
  !*** external "@restart/ui/ModalManager" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/ui/ModalManager");

/***/ }),

/***/ "@restart/ui/utils":
/*!************************************!*\
  !*** external "@restart/ui/utils" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@restart/ui/utils");

/***/ }),

/***/ "classnames":
/*!*****************************!*\
  !*** external "classnames" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("classnames");

/***/ }),

/***/ "dom-helpers/addClass":
/*!***************************************!*\
  !*** external "dom-helpers/addClass" ***!
  \***************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/addClass");

/***/ }),

/***/ "dom-helpers/addEventListener":
/*!***********************************************!*\
  !*** external "dom-helpers/addEventListener" ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/addEventListener");

/***/ }),

/***/ "dom-helpers/canUseDOM":
/*!****************************************!*\
  !*** external "dom-helpers/canUseDOM" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/canUseDOM");

/***/ }),

/***/ "dom-helpers/css":
/*!**********************************!*\
  !*** external "dom-helpers/css" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/css");

/***/ }),

/***/ "dom-helpers/ownerDocument":
/*!********************************************!*\
  !*** external "dom-helpers/ownerDocument" ***!
  \********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/ownerDocument");

/***/ }),

/***/ "dom-helpers/querySelectorAll":
/*!***********************************************!*\
  !*** external "dom-helpers/querySelectorAll" ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/querySelectorAll");

/***/ }),

/***/ "dom-helpers/removeClass":
/*!******************************************!*\
  !*** external "dom-helpers/removeClass" ***!
  \******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/removeClass");

/***/ }),

/***/ "dom-helpers/removeEventListener":
/*!**************************************************!*\
  !*** external "dom-helpers/removeEventListener" ***!
  \**************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/removeEventListener");

/***/ }),

/***/ "dom-helpers/scrollbarSize":
/*!********************************************!*\
  !*** external "dom-helpers/scrollbarSize" ***!
  \********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/scrollbarSize");

/***/ }),

/***/ "dom-helpers/transitionEnd":
/*!********************************************!*\
  !*** external "dom-helpers/transitionEnd" ***!
  \********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("dom-helpers/transitionEnd");

/***/ }),

/***/ "prop-types":
/*!*****************************!*\
  !*** external "prop-types" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("prop-types");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react-transition-group/Transition":
/*!****************************************************!*\
  !*** external "react-transition-group/Transition" ***!
  \****************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-transition-group/Transition");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/react-bootstrap","vendor-chunks/slick-carousel","vendor-chunks/bootstrap"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();