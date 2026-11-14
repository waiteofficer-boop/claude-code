# uso: python3 -I tts.py <voz> <taxa> <texto> <saida.mp3> [saida_palavras.json]
import asyncio, ssl, sys, json
import edge_tts, edge_tts.communicate as C
C._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")  # CA do proxy da sessão
voice, rate, text, out = sys.argv[1:5]
async def main():
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    if len(sys.argv) > 5: json.dump(words, open(sys.argv[5], "w"), ensure_ascii=False)
asyncio.run(main())
