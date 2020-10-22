# CI Tools

Allgemeines Tooling, welches im Rahmen unseres Release-Prozesses verwendet wird.

## Was sind die Ziele dieses Projekts?

Belastbare Automatisierung kritischer CI-Workflows.

## Wie kann ich das Projekt aufsetzen?


### Voraussetzungen

* Node `>= 10.0.0`
* npm `>= 6.0.0`


### Setup/Installation

```shell
$ npm install @process-engine/ci_tools
```

## Wie kann ich das Projekt benutzen?


### Benutzung

```shell
$ ci_tools --help
```

### Philosophie

Die `ci_tools` automatisieren Teilschritte unseres Release-Prozesses, welche andernfalls manuell ausgeführt werden müssten.

**Prinzip 1: Es gibt keine Abkürzungen**

Die Automatisierung nimmt keine "Abkürzungen", sondern erledigt eine Aufgabe in der gleichen Art und Weise, wie die manuelle Erledigung durch einen unserer Entwickler ablaufen würde.

Das bedeudet, dass die `ci_tools` bspw. genau so mit Git committen, Releases taggen und GitHub-Releases editieren wie ein Mensch das sinnvollerweise tun würde.

Hierdurch wird zum einen ermöglicht, dass bei einem Totalausfall der CI-Pipeline die entsprechenden Befehle auch an einem anderem Ort, zur Not einem Entwicklerrechner ausführbar sind.

**Prinzip 2: So wenig Kommandos wie möglich, so viele wie nötig**

Die Kommandos der CI Tools beschreiben zusammenhängende Vorgänge, die sich über unsere Repos gleichen.

Beispiele:

- Version gemäß Release-Prozess-Konzept hochziehen
- aktuelle Version committen, taggen und pushen (mit Changelog als Body des Commits/Tags, danach einmal das GitHub-Release öffnen und speichern, um den Markdown-Formatter von GitHub zu aktivieren)

Wir stellen mit den CI Tools sicher, dass bei diesen Vorgängen bestimmte Vorbedingungen erfüllt sind und

**Wichtig:** Es werden keine Shell-Befehle gewrappt/abstrahiert, die genauso gut "flach" im jeweiligen CI-Workflow stehen könnten, insbesondere, wenn es sich um projekt-/programmiersprachen-spezifische Einzeiler handelt.

Wir wollen an dieser Stelle vermeiden, dass wir Dinge abstrahieren, die auch gut ohne Abstraktion funktioneren.

So gibt es bspw. bewusst *kein* magisches Build- oder Test-Kommando in den CI Tools, welches für verschiedene Programmiersprachen automatisch den *"richtigen"* Build- oder Test-Befehl ausführt, da die Entwickler innerhalb eines Projekts am Besten wissen, mit welchen Befehlen/Tools/Parametern sie am *passendsten* bauen/testen.

# Wen kann ich auf das Projekt ansprechen?

* René Föhring
