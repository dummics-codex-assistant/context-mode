# context-mode per Codex

context-mode e' disponibile come MCP e come hook Codex. Usalo come strumento di igiene del contesto, non come stile di risposta o workflow dominante.

## Principio

Usa context-mode quando un comando, una lettura o una ricerca rischia di produrre molto output grezzo. Mantieni nel contesto solo sintesi, file rilevanti, evidenza e decisioni.

Non sostituisce le istruzioni globali dell'owner, le skill del progetto, `AGENTS.md` locali, gate Git/write, review policy o tono richiesto. Se queste regole confliggono con le istruzioni globali, vincono le istruzioni globali.

## Quando usarlo

- log lunghi, transcript, JSONL, sessioni, output CI/test voluminoso
- `rg`, `git`, scansioni o inventari con molti risultati
- confronto tra molti file o directory
- analisi di dati strutturati, conteggi, filtri, deduplica, clustering
- pagine web o documenti grandi da indicizzare e interrogare
- ripresa sessione quando serve cercare decisioni o vincoli gia' indicizzati

## Quando non serve

- comandi Git brevi e mirati
- lettura di pochi file prima di editarli
- diff piccoli o file gia' identificati
- verifiche che producono meno di circa 20 righe utili
- micro-risposte o domande concettuali senza bisogno di contesto locale

## Scelta strumenti

1. `ctx_batch_execute(commands, queries)`: default per discovery multi-comando. Etichette descrittive, query gia' pensate.
2. `ctx_search(queries, source, sort)`: follow-up su contenuto gia' indicizzato o memoria sessione.
3. `ctx_execute(language, code)`: analisi computazionale o comando filtrato che deve stampare solo risultato/sintesi.
4. `ctx_execute_file(path, language, code)`: analisi di file grande senza portare tutto nel contesto.
5. `ctx_fetch_and_index(url, source)`: pagine/documenti web grandi; poi interrogare con `ctx_search`.

Per creare o modificare file usa gli strumenti nativi di Codex. Non usare context-mode come writer di file.

## Hook e sicurezza del contesto

Gli hook possono bloccare o guidare operazioni rumorose come fetch raw, `curl`/`wget`, HTTP inline o output enormi. Se un hook blocca un comando, riformula l'azione con output filtrato o usa uno dei tool `ctx_*`.

Non aggirare l'hook ripetendo lo stesso comando con un wrapper diverso. Riduci l'output o indicizzalo.

## Comandi utente

- `ctx stats`: mostra statistiche context-mode.
- `ctx doctor`: diagnostica installazione/hook/MCP.
- `ctx upgrade`: aggiorna context-mode, poi riavvio sessione.
- `ctx purge`: irreversibile; usare solo se l'owner lo chiede esplicitamente.

## Stile

Rispondi nella lingua e nel tono richiesti dalle istruzioni globali. context-mode deve rendere il lavoro piu' leggero e verificabile, non cambiare personalita', formato o priorita' operative.
