import {describe,expect,it} from "vitest";
import {mergeMasjids,type Mosque} from "./masjids";

const mosque=(overrides:Partial<Mosque>={}):Mosque=>({id:"one",name:"Masjid Al Noor",address:null,distanceKm:1,latitude:41,longitude:-87,phone:null,website:null,congregationTimes:null,...overrides});

describe("mergeMasjids",()=>{
  it("deduplicates nearby equivalent listings and preserves richer fields",()=>{const result=mergeMasjids([[mosque({address:"1 Main St"})],[mosque({id:"two",name:"Al Noor Islamic Center",latitude:41.0002,website:"https://example.com/"})]]);expect(result).toHaveLength(1);expect(result[0]).toMatchObject({address:"1 Main St",website:"https://example.com/"})});
  it("keeps distinct nearby mosques",()=>{expect(mergeMasjids([[mosque()],[mosque({id:"two",name:"Masjid Al Falah",latitude:41.01})]])).toHaveLength(2)});
});
