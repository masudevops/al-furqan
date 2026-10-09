import {afterEach,describe,expect,it,vi} from "vitest";
import {fetchOvertureMasjids,fetchTakbeerTimeMasjids,mergeMasjids,overtureTileKeys,TAKBEER_TIME_LIMIT,type Mosque} from "./masjids";

const mosque=(overrides:Partial<Mosque>={}):Mosque=>({id:"one",name:"Masjid Al Noor",address:null,distanceKm:1,latitude:41,longitude:-87,phone:null,website:null,congregationTimes:null,...overrides});

describe("mergeMasjids",()=>{
  it("deduplicates nearby equivalent listings and preserves richer fields",()=>{const result=mergeMasjids([[mosque({address:"1 Main St"})],[mosque({id:"two",name:"Al Noor Islamic Center",latitude:41.0002,website:"https://example.com/"})]]);expect(result).toHaveLength(1);expect(result[0]).toMatchObject({address:"1 Main St",website:"https://example.com/"})});
  it("merges same-name listings a short walk apart",()=>{expect(mergeMasjids([[mosque()],[mosque({id:"two",latitude:41.0011})]])).toHaveLength(1)});
  it("merges same-name listings sharing a street address despite distant pins",()=>{expect(mergeMasjids([[mosque({address:"1601 W Campbell Rd, Garland, TX"})],[mosque({id:"two",latitude:41.016,address:"1601 W Campbell Rd, Garland, TX, 75044"})]])).toHaveLength(1)});
  it("keeps same-name masjids in different places",()=>{expect(mergeMasjids([[mosque({address:"1 Main St"})],[mosque({id:"two",latitude:41.05,address:"9 Oak Ave"})]])).toHaveLength(2)});
  it("keeps distinct nearby mosques",()=>{expect(mergeMasjids([[mosque()],[mosque({id:"two",name:"Masjid Al Falah",latitude:41.01})]])).toHaveLength(2)});
});

describe("fetchTakbeerTimeMasjids",()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it("requests no more than the provider's accepted limit",async()=>{const fetchMock=vi.fn<(url:URL)=>Promise<Response>>(async()=>new Response(JSON.stringify({data:[{id:"a",name:"Masjid",latitude:41,longitude:-87,distanceMeters:500}]})));vi.stubGlobal("fetch",fetchMock);const result=await fetchTakbeerTimeMasjids({latitude:41,longitude:-87,radius:20000});expect(Number(fetchMock.mock.calls[0][0].searchParams.get("limit"))).toBeLessThanOrEqual(20);expect(TAKBEER_TIME_LIMIT).toBe(20);expect(result[0]).toMatchObject({id:"takbeer:a",distanceKm:.5})});
});

describe("overtureTileKeys",()=>{
  it("covers every one-degree cell touched by the search radius",()=>{expect(overtureTileKeys({latitude:41.95,longitude:-87.98,radius:20000}).sort()).toEqual(["41_-88","41_-89","42_-88","42_-89"])});
  it("wraps cells across the antimeridian",()=>{expect(overtureTileKeys({latitude:0,longitude:179.9,radius:20000})).toContain("0_-180")});
});

describe("fetchOvertureMasjids",()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it("reads only populated nearby tiles and keeps results inside the radius",async()=>{
    const fetchMock=vi.fn<(url:string)=>Promise<Response>>(async url=>new Response(JSON.stringify(url.endsWith("manifest.json")?{v:1,release:"r",tileDegrees:1,tiles:{"41_-88":2}}:{v:1,items:[["near","Masjid Near",41.5,-87.5,"1 Main St",null,"example.org"],["far","Masjid Far",41.9,-87.1,null,null,null]]})));
    vi.stubGlobal("fetch",fetchMock);
    const result=await fetchOvertureMasjids({latitude:41.5,longitude:-87.5,radius:20000},"https://tiles.example");
    expect(fetchMock.mock.calls.map(call=>call[0])).toEqual(["https://tiles.example/manifest.json","https://tiles.example/tiles/41_-88.json"]);
    expect(result).toEqual([expect.objectContaining({id:"overture:near",address:"1 Main St",website:"https://example.org/",distanceKm:0})]);
  });
});
