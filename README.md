# Secret bookmarks

Encrypted bookmark web server.

There are already multiple programs out there that allow you to store bookmarks privately, locking it away with passwords. However, they fall short on the fact it's very hard to use them on a mobile browser. It's a hassle having to switch to a different app to open your bookmarks. And as far as I know, there's no way to open them in incognito mode on a browser like Chrome. To add a bookmark, you'll have to either copy the link or use the share feature, both of which are very slow methods.

The solution is for the bookmark system to be a website. It'll be right there in the browser; you can use your bookmarks the same way as any link on the internet. The only problem is that you'd have to send your data to a server somewhere, since cookies and other web storage methods would not appear in an incognito tab. This can be solved by hosting the server yourself, in your PC, or somehow on Android itself. Good luck with that, but you could theoretically use Termux - I haven't tried it.

You can type in the password when you enter into the list, or add it in as the hash of the URL. You can use the endpoint `/add`, with parameters `password` and `url` to add in a new URL, which will close immediately after.

If you're using Chrome: To simplify the process of adding a new URL, you can store a Chrome bookmark with the URL `javascript:open("http://**your-ip**:5000/add?password=**your-password**&url="+encodeURIComponent(window.location.href))`. Then you can type in the address bar the name of this bookmark (name it something simple like "add") and select it in the auto complete list. If you don't want to have your password there, you can add `"+prompt("Password:")+"` in its place.

But why would you store secret bookmarks anyway? To store links to gifts you are shopping for your girlfriend that you don't want her to know, of course!