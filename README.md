### background

a test to explore ways to embed potentially unsafe code in an iframe and be reasonably certain it won't do anything bad.


bad things include:
- posting to unknown endpoints with javascript
- submitting sneaky data via GET request to unknown endpoints by adding `script`, `img` or other tags to the document with a target `src` attribute
- modify the parent window
- accessing cookies from parent window's host


it would be better if using the postmessage api to communicate with the embed remained possible

### findings

postmessage works in all the examples (except the one where javascript was disabled). it seems like if you use some way to ensure a content security policy is also defined for your sandboxed (non-same-origin) iframe, you can pretty much rely on its isolation.

bad things can be controlled with:
- posting to unknown endpoints with javascript - content security policy
- submitting sneaky data via GET request to unknown endpoints by adding `script`, `img` or other tags to the document with a target `src` attribute - content security policy
- modify the parent window - sandbox without `allow-same-origin` or an iframe `src` on a different origin
- accessing cookies from parent window's host - iframe sandbox

### recommendations 

#### if you're ok with writing some JS to manage your embeds

you can do either of the `srcdoc` methods, the inline code one might be better if the code isn't available on the internet (user defined in the UI?) or if you want to disable all network resources. the script tag one might be better if the script is bigger.

because these iframes have no src, `allow-same-origin` will always allow modifying the parent document, this means they will never be able to access any cookies. (this may be considered a good or a bad thing...)

#### if you want to avoid JS

you need to control how the index document of your embed is being served, so you can ensure it has either csp headers or meta tags. the iframe needs to be sandboxed and the embed should be on a different origin, or not have the `allow-same-origin` sandbox (if its on a different origin you can add `allow-same-origin` and it will have access to whatever cookies are on the embedded origin). via the csp values you have petty good control over if you want only the script file available, or any resources on a certain host, or some path prefix.


### procedure
run these at the same time:
```
serve -l 8080 
```
```
serve -l 8081 -c ./serve.json
```
```
serve -l 8082 -c ./serve.json
```
```
serve -l 8083 -c ./serve-csp.json
```

there are two target files, both do the same thing but one is html with inline js and one is just js. these files try to do the following:
- listen for postmessage and log it
- remove meta tags (to see if csp tags can be removed)
- trigger an `alert`
- add images at 4 hosts to the document
- try to change the parent window background color to red


load the host file `http://localhost:8080/` and append query params to specify the behavior for the test case. supported params are:
- src: sets the src attribute of the iframe
- sandbox: sets the sandbox attribute of the iframe
- scriptTag: generates an embed document with a script tag with the given source and injects this document into the embed with the srcdoc attribute. a meta tag is added with a content security poicy
- inlineScript: fetches script content and generates a document with the script in line, then injets that into the embed. a meta tag is added with the hashed script contents allowing only it to be run inline.

### test cases

#### with src embeds

http://localhost:8080/?src=http://localhost:8080/parent-access-iframe.html

the basic example, no sandbox, no csp, just an iframe on same origin source, allows all the bad things


http://localhost:8080/?src=http://localhost:8081/parent-access-iframe.html

different origin, no sandbox, no csp, allows the alert and all 3 images


http://localhost:8080/?src=http://localhost:8081/parent-access-iframe.html?sandbox=

different origin, sandbox, no csp, displays html content but nothing else happens because js is not allowed


http://localhost:8080/?src=http://localhost:8081/parent-access-iframe.html?sandbox=allow-scripts

different origin, sandbox, no csp, same as before but with allow-scripts, blocks alert and parent document access, allows loading any resources


http://localhost:8080/?src=http://localhost:8080/parent-access-iframe.html?sandbox=allow-scripts

same origin, sandbox, no csp, same as before but on common origin, still doesn't allow cross window access because of the sandbox


http://localhost:8080/?src=http://localhost:8080/parent-access-iframe.html?sandbox=allow-scripts allow-same-origin

same origin, sandbox, no csp, same as before but adding `allow-same-origin` to the sandbox. still blocks the alert but now allows modifying the parent window. this is generally considered to be useless because the framed script can just modify its own iframe to remove the sandbox


http://localhost:8080/?src=http://localhost:8081/parent-access-iframe.html?sandbox=allow-scripts allow-same-origin

different origin, sandbox, no csp, same as before but not on the same host. interestingly `allow-same-origin` doesn't actually override the fact that the script is loading from a different origin. the access to the parent document is in fact blocked here. in this case the `allow-same-origin` property is just allowing the embed to run on its actual origin, letting it use its own cookies, but doesn't allow anything from the parent origin.


http://localhost:8080/?src=http://localhost:8083/parent-access-iframe.html?sandbox=allow-scripts%20allow-same-origin

different origin, sandbox, csp, now with csp all images not served from the allowed host are blocked. the only downside here is that you have to kind of trust that the embedded html is going to set its own content security policy

#### with inline script embeds

http://localhost:8080/?inlineScript=http://localhost:8081/load-image.js&sandbox=allow-scripts%20allow-same-origin

different kind of approach here, fetching a script file's text and manually loading it into an iframe using the `srcdoc` property. this is by definition a same origin situation (aparently) so setting `allow-same-origin` does allow parent document access. using this method we control what to set the csp to, so i have it arbitrarily defined to allow connections to the same host that the parent page is served on. this doesn't affect the running of the script, which is injected and specifically allowed via hash of the script. you could theoretically actually set the url access to `none` and it wouldn't be able to load any resources from anywhere


http://localhost:8080/?inlineScript=http://localhost:8081/load-image.js&sandbox=allow-scripts

same as before without the `allow-same-origin`, this blocks parent document access (and all other bad things) while allowing the embed to load resources from specified hosts and the postMessage api works.

#### with inline script tag embeds

http://localhost:8080/?scriptTag=http://localhost:8080/load-image.js&sandbox=allow-scripts

a variation of the inline script, which injects the html of the embed with `srcdoc` but refernces the script via url (instead of just injecting the text). the effect is similar to the previous case but has the requirement that the embed be allowed to load resources (at least scripts, if not other resources) from the place the js file is being loaded from. (it seems like this can be dynamically restricted to just the one source file though)
