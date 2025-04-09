import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import time

def get_ozon_price(query):
    headers = { "User-Agent": "Mozilla/5.0" }
    url = f"https://www.ozon.ru/search/?text={query}"
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    item = soup.select_one("a[href*='/product/']")
    if not item: return None
    link = "https://ozon.ru" + item["href"]
    price_tag = item.select_one("span[class*='price']")
    price = int(price_tag.text.replace("₽", "").replace(" ", "")) if price_tag else None
    return { "value": price, "url": link }

def get_wb_price(query):
    headers = { "User-Agent": "Mozilla/5.0" }
    url = f"https://www.wildberries.ru/catalog/0/search.aspx?search={query}"
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    item = soup.select_one("a.product-card__main")
    if not item: return None
    link = "https://www.wildberries.ru" + item["href"]
    price_tag = item.select_one("ins.price__lower-price")
    price = int(price_tag.text.replace("₽", "").replace(" ", "")) if price_tag else None
    return { "value": price, "url": link }

def get_ali_price(query):
    headers = { "User-Agent": "Mozilla/5.0" }
    url = f"https://www.aliexpress.com/wholesale?SearchText={query}"
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    item = soup.select_one("a[href*='/item/']")
    if not item: return None
    link = item["href"] if item["href"].startswith("http") else "https:" + item["href"]
    price_tag = item.select_one("div[class*=manhattan--price]")
    price = None
    if price_tag:
        price_text = price_tag.text.replace("$", "").replace(",", ".").strip()
        try:
            price = round(float(price_text) * 90)
        except:
            price = None
    return { "value": price, "url": link }

base_dir = Path(__file__).resolve().parent.parent
filaments_path = base_dir / "filaments_data" / "filaments.json"
prices_path = base_dir / "filaments_data" / "prices.json"

with open(filaments_path, "r", encoding="utf-8") as f:
    filaments = json.load(f)

prices = {}
for filament in filaments:
    name = f"{filament['brand']} {filament['type']} {filament['weight_g']}г"
    print(f"⏳ Парсим: {name}")
    prices[filament["id"]] = {
        "ozon": get_ozon_price(name),
        "wb": get_wb_price(name),
        "aliexpress": get_ali_price(name)
    }
    time.sleep(2)

with open(prices_path, "w", encoding="utf-8") as f:
    json.dump(prices, f, ensure_ascii=False, indent=2)

print("✅ prices.json обновлён")
