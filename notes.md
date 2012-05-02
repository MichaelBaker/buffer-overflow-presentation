# What the presentation is about
How a malicious user can access data intended to be hidden from them

# What pieces of knowledge are required to understand
* How the stack works
* What shell code is
* The setuid permission
* How the instruction pointer and return pointer work
* The problem with strcpy
* Little endian vs big endian
* How to disassembly a program
* noop slide


Ultimately a buffer overflow allows a non-privileged user to become a root user by getting a privileged program to execute code that the user has written.

Possible due to the confluence of programmer error, language design, hardware architecture, and operating system architecture.

To understand how each of these components contributes to this vulnerability, we need to start at the bottom and develop an accurate model of how the machine works.

Here is the model we'll be using. The large rectangle is the computer's memory. Each box represents a chunk of memory in which we can store one piece of information. This can be a character, a number, or an instruction to the computer. It's important to note that there is no difference between instructions to the computer and data in this model. The memory itself only sees bytes. What makes the byte a number, character, or instruction is purely how we interpret it in our software. In order to use this data, we need a way to specify which box of data we're talking about and so each box has an address. When we want to store or retrieve something from the memory, we do so through its address. The last piece of our model is this special piece of memory where we store the address of the instruction for the computer to execute. This is how we tell the computer to consider one of our blocks to be an instruction rather than a piece of data. If the data's address is in this box, BAM, it's an instruction and the computer will execute it. I'll be calling it the instruction pointer because that's what it's called.

Using that model we can describe how a user's input string can end up being run as if it were a program. Here's a program that does just that. First it reads a string from the user into memory. Then it sets the instruction pointer to the address of that string. So we've got instruction R that says to read a byte and store it at the next available address from the top, we've got instruction G that says to put the value of the next byte into the instruction pointer, and we've got instruction P that will print the next byte on the screen. So here's our program that will read our input and execute it as if it were another program

While this is a really stupid program, this is exactly what a buffer overflow accomplishes. At its heart it puts our input into memory and then tells the computer to execute it as if it were a program.

Now let's say we want to confirm that we've read each character from the user. We could do that like this: &lt;shows program with a lot of duplication&gt; but that's a lot of duplication. Instead, lets move all of the printing instructions into one group and then jump to it every time we want to print that message; &lt;shows dry program&gt; That's a lot better but there's a problem. How do we get back to the main program once we print the message? Our computer isn't smart enough to be able to do that yet. So let's make it a little bit smarter. We'll add an instruction that saves the next value of the instruction pointer and another instruction that restores it. Now our program looks like this &lt;final&gt; Now we can write reusable procedures! BOOYAH ship it!

But here's where we get burned by the harsh reality of the x86 processors that we all use. On these processors, when we save information into memory, it does so backwards. Instead of putting the data in memory in increasing order, it does so in decreasing order. However, we still think about continuous blocks of data in terms of increasing addresses. As a result, if we want to read in all of the user's data and then operate on it, we have to set aside enough space for ourselves and then copy the data into the space we've saved like this... This chunk of memory we've set aside is the buffer in buffer overflow.

This isn't so bad. It's a little weird and confusing, but hey it's Intel's world and we're just living in it so we'll just have to deal.

Now what if we want to accept programs of different lengths? We need some way for the user to indicate that they're done typing. I know, we'll just put a zero on the end! Then whenever we see a zero, we'll know to stop reading the input!

Here's our new and improved program that will take input of any length up to 4 characters.

And now our computer is sufficiently close to reality to demonstrate the overflow in buffer overflow.

This is where programmer error and language design conspire to make this exploit possible. Recall that we decided to mark the end of user input with a zero. Also notice that no where in our program to we check the length of the user's input to make sure it fits into the buffer we've set aside for ourselves. So what's going to happen if we input 5 characters instead of 4?

The answer is that we're going to write past the end of our buffer and corrupt the next byte of our memory. Also recall that if we're in the middle of a procedure call, then the next byte represents the location of the next instruction to execute. 

Let's perform a complete buffer overflow attack on this program and get it to do what we want rather than what the programmer intended.

Now we can get the computer to print this annoying message. The question becomes, how does this help us to take control of the computer?

On Unix systems there are some commands that any user can run, but also require root access. One such command is sudo. Any user can run it, but it needs root permission to execute a command as root. One solution to this problem is the setuid bit. If this permission is set, then anyone in the 'wheel' group can run the command, but the process itself will have root access. Normally this isn't a problem because the program won't let the user do anything unsafe. But if there'a a programmer error like the one above, then we can tell this program, which has root access, to do what ever we want, such as changing another user's password, or even starting a new shell with root access.

So this is the exploit itself. All that's left to do is map our model into reality.

So back on our list we have four things that lead to making this exploit possible. First we'll talk about is hardware architecture.

This exploit would not be possible if our code and our data were stored in two different places. If that were the case then it would not be possible to mistake data for code. However, that is the reality of the x86 architecture. As a result it is the programmer's responsibility to make sure these things are kept separate. In an effort to get around this limitation, the processor does allow us to mark certain bits of memory as non-executable and some operating systems make use of this to prevent the computer for executing anything in the part of memory holding the program's data.

The second thing that makes this attack possible is the way the C programming language handles strings. In C, strings are just like our buffer above. They're just a bunch of bytes in a row and you can't tell how much memory has been allocated for one by looking at it. Instead, you have to pass around the maximum length of a string as a separately from the string itself. This lack of abstraction has lead to the <code>strcpy</code> function in the C standard library. This function copies one string into another in exactly the boneheaded way we did it above and creates a vector for this attack. The way to protect yourself from this is to use a string library that provides a proper abstraction when working with strings instead of using C's fake strings and the standard library.

Next, we have operating system design. You'll notice that we were only able to execute this attack because we could guess the address that our input would be store at. In a modern computer, the operating system gets to decide what all of those numbers are. In many operating systems, like OSX for example, those addresses are almost the same every time the program runs which allows us to employ a number of techniques for figuring out what it might be. One way that the operating system can make it difficult or impossible to execute this kind of attack is to randomize the memory addresses. If we can't guess these addresses, then we don't know where to jump to and we can't get our code to execute.
