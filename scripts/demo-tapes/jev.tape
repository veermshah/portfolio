Output jev.mp4
Output jev.gif
Set Shell bash
Set FontSize 18
Set Width 1400
Set Height 820
Set Padding 24
Set Theme "GitHub Dark"
Set TypingSpeed 45ms
Hide
Type "cd ~/work/jev-support-desk && source .venv/bin/activate && export PS1='$ ' && clear"
Enter
Show
Type "# A customer's failing API request, pasted from a support ticket"
Enter
Sleep 500ms
Type "jev-desk doctor examples/401_bad_header.json"
Enter
Sleep 6s
Type "clear"
Enter
Type "# Measured routing accuracy on 36 labeled tickets (committed eval report)"
Enter
Type "sed -n '1,25p' results/eval.md"
Enter
Sleep 6s
Type "clear"
Enter
Type "# End-of-shift handoff built from the same cached triage"
Enter
Type "sed -n '1,12p' results/handoff.md | cut -c1-130"
Enter
Sleep 7s
