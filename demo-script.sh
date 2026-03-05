#!/bin/bash
# This script simulates the tarmac flow for demo recording

# Initial delay so VHS can switch from Hide to Show
sleep 1

print_slow() {
  local text="$1"
  for (( i=0; i<${#text}; i++ )); do
    printf '%s' "${text:$i:1}"
    sleep 0.03
  done
}

# Scene 1: Install
printf '$ '
print_slow "npm install -g tarmac-cost"
sleep 0.5
echo ""
sleep 0.3
echo "added 3 packages in 1.2s"
echo ""
sleep 1.2

# Scene 2: Setup
printf '$ '
print_slow "tarmac-cost setup"
sleep 0.5
echo ""
sleep 0.3
echo ""
echo "  ✈  Tarmac v0.1 — Pre-flight cost estimation for Claude Code"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✓  Hooks installed (~/.claude/settings.json)"
echo "  ✓  Config saved (~/.tarmac/config.json)"
echo ""
echo "  ✈  Setup complete! Tarmac is now active."
echo ""
sleep 2

# Scene 3: Open Claude Code
printf '$ '
print_slow "claude"
sleep 0.5
echo ""
sleep 0.5
echo ""
echo "╭─────────────────────────────────────────────╮"
echo "│  Claude Code                  ◉ Opus 4.6    │"
echo "╰─────────────────────────────────────────────╯"
echo ""
printf '> '
sleep 1

# Scene 4: User types prompt
print_slow "Refactor the auth module to use JWT tokens instead of sessions"
sleep 0.8
echo ""
sleep 1.5

# Scene 5: Cost estimate appears
echo ""
echo "  ⚡ TARMAC COST ESTIMATE"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "    Sonnet 4.6    \$0.45 - \$1.62"
echo "    Opus 4.6      \$2.18 - \$7.84"
echo "    Haiku 4.5     \$0.11 - \$0.39"
echo ""
echo "    Task type: refactoring"
echo "    Input: 847 tokens"
echo "    Coverage: 80% confidence interval"
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sleep 1.2

# Scene 6: Claude presents it
echo "  This task is estimated at \$2.18 - \$7.84 on Opus 4.6."
echo "  Want to proceed, or would you prefer a cheaper model?"
echo "  (Run: claude --model sonnet for ~\$0.45 - \$1.62)"
echo ""

sleep 4
