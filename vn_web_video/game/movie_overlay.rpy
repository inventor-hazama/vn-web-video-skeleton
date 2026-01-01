# game/movie_overlay.rpy

screen movie_choice_overlay(choice_items, autosel=None):
    # Overlay UI is rendered by Ren'Py canvas and appears above the HTML video layer.
    zorder 200

    vbox:
        xpos 0.06
        ypos 0.72
        spacing 10

        for c in choice_items:
            textbutton c["text"] action Return(c["id"])

    if autosel and autosel.get("enabled"):
        timer autosel.get("delay", 1.5) action Return(autosel.get("pick_id"))
