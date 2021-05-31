/*
 * fract.js
 *
 * version 1.0.1
 *
 * A small javascript library for replacting/updating fractions of a page dynamically from server-side responses.
 *
 * Licensed under The MIT License (MIT)
 * Copyright © 2021 YANO Tsutomu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the “Software”), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
function findElementByComponentPath(componentPath) {
    let path = null;
    if(componentPath.indexOf(':') >= 0) {
        path = componentPath.split(':')
                            .filter(item => item != null)
                            .map(item => '*[data-fract-id="' + item + '"]')
                            .join(' ');

    } else {
        path = '*[data-fract-id="' + componentPath + '"]';
    }
    if(path.length > 0) {
        return document.querySelector(path);
    } else {
        return null;
    }
}

function createFractionElements(fractions) {
    if(fractions == null) {
        return [];
    }

    if(!Array.isArray(fractions)) {
        fractions = [fractions];
    }

    return fractions.map(fraction => {
        const template = document.createElement('template');
        template.innerHTML = fraction.trim();
        return template.content.firstChild;
    });
}

function replace(path, targetElement, newElements) {
    if(targetElement && newElements) {
        if(newElements.length > 1) {
            console.error('More than one fraction element are returned from server for path: %s', path);
            return;
        }

        const element = newElements[0];
        const parent = targetElement.parentNode;
        if(parent) {
            parent.replaceChild(element, targetElement);
        }
    }
}

function prepend(path, targetElement, newElements) {
    if(targetElement && newElements) {
        let current = targetElement;
        const parent = targetElement.parentNode;
        if(parent) {
            newElements.forEach(newElement => {
                current = parent.insertBefore(newElement, current);
            });
        }
    }
}

function append(path, targetElement, newElements) {
    if(targetElement && newElements) {
        let current = targetElement;
        newElements.forEach(newElement => {
            current.after(newElement);
            current = newElement
        });
    }
}

function wrapByFunction(scriptStr) {
    return '(function() {' + scriptStr + '})();';
}

export function handleFractResponse({redirect, components, preAction, postAction}) {
    if(redirect) {
        window.location = redirect;
        return;
    } else {
        let preActionResult = null;
        if(preAction) {
            preActionResult = eval(wrapByFunction(preAction));
        }
        if(preActionResult === false) {
            return;
        }
        if(components) {
            Object.keys(components).forEach(p => {
                const componentPath = p.trim();
                const targetElement = findElementByComponentPath(componentPath);
                if(targetElement) {
                    const updateInfo = components[componentPath];
                    if(updateInfo) {
                        let fractions = [];
                        if(Array.isArray(updateInfo) || (typeof (updateInfo) === "string" || updateInfo instanceof String)) {
                            fractions = updateInfo;
                        } else {
                            fractions = updateInfo.fractions;
                        }
                        const {preAction: componentPreAction, postAction: componentPostAction} = updateInfo;

                        let componentPreActionResult = null;
                        if(componentPreAction) {
                            componentPreActionResult = eval(wrapByFunction(componentPreAction));
                        }
                        if(componentPreActionResult !== false) {
                            if(fractions) {
                                const newElements = createFractionElements(fractions);
                                if(newElements.length > 0) {
                                    const method = updateInfo.method || 'replace';
                                    switch(method) {
                                        case 'prepend':
                                            prepend(componentPath, targetElement, newElements);
                                            break;
                                        case 'replace':
                                            replace(componentPath, targetElement, newElements);
                                            break;
                                        case 'append':
                                            append(componentPath, targetElement, newElements);
                                            break;
                                    }
                                }
                            } else {
                                console.warn('No fractions are found in the component map in a current response.');
                            }

                            if(componentPostAction) {
                                eval(wrapByFunction(componentPostAction));
                            }
                        }
                    }
                }
            });
        }
        if(postAction) {
            eval(wrapByFunction(postAction));
        }
    }
}

export function send(url, fetchOpts) {
    if(fetchOpts == null) {
        fetchOpts = {};
    }
    if(fetchOpts.headers == null) {
        fetchOpts.headers = {};
    }
    if(fetchOpts.headers.Accept == null) {
        fetchOpts.headers.Accept = "application/json";
    }
    return fetch(url, fetchOpts).then(response => {
        if(response.ok) {
            response.json().then(data => {
                handleFractResponse(data);
            });
        } else {
            console.error("An error response is returned:", response);
        }
        return response;
    }, reason => {
        console.error("error occurred:", reason);
        return reason;
    });
}

export function sendForm(formElement, fetchOpts) {
    if(formElement) {
        const formData = new FormData(formElement);
        const url = formElement.attributes.action.value;
        const method = formElement.attributes.method.value;
        if(fetchOpts == null) {
            fetchOpts = {};
        }
        if(fetchOpts.method == null) {
            fetchOpts.method = method;
        }
        if(fetchOpts.body == null) {
            fetchOpts.body = formData;
        }
        return send(url, fetchOpts)
    }
}