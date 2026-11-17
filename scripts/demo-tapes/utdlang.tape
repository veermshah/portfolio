Output utdlang.mp4
Output utdlang.gif
Set Shell bash
Set FontSize 18
Set Width 1400
Set Height 820
Set Padding 24
Set Theme "GitHub Dark"
Set TypingSpeed 45ms
Hide
Type "cd ~/work/CompilerProject && export PS1='$ ' && alias utdc='java -cp .:java-cup-11b.jar TypeCheckingTest' && clear"
Enter
Show
Type "# UTDLang: JFlex lexer + CUP parser + scoped symbol tables + type checker"
Enter
Type "cat p3tests/p3tests/badTernaryTypes.as"
Enter
Sleep 2s
Type "utdc p3tests/p3tests/badTernaryTypes.as; echo"
Enter
Sleep 2500ms
Type "clear"
Enter
Type "cat p3tests/p3tests/reassignFinal.as"
Enter
Sleep 2s
Type "utdc p3tests/p3tests/reassignFinal.as; echo"
Enter
Sleep 2500ms
Type "clear"
Enter
Type "head -25 p3tests/p3tests/fullValidProgram.as"
Enter
Sleep 2500ms
Type "utdc p3tests/p3tests/fullValidProgram.as; echo"
Enter
Sleep 3s
