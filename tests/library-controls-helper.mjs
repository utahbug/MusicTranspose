export async function setView(p,value){
 for(const view of ['favorites','recent'])if(await p.locator('#view-'+view).getAttribute('aria-pressed')==='true')await p.locator('#view-'+view).click();
 const source={'Hymns (1985)':'hymnal','Children’s Songbook':'children','Hymns for Home and Church':'home-church'}[value]||'all';await p.locator('#library-source').selectOption(source);
 if(['favorites','recent'].includes(value))await p.locator('#view-'+value).click();
}
export async function getView(p){for(const v of ['favorites','recent'])if(await p.locator('#view-'+v).getAttribute('aria-pressed')==='true')return v;return 'all';}
export async function setOrder(p,value){if(await p.locator('#order-toggle').count()&&value!=='list'){if(await getOrder(p)!==value)await p.locator('#order-toggle').click();return;}if(value==='list'){if(await p.locator('#reorder-list').getAttribute('aria-pressed')!=='true')await p.locator('#reorder-list').click();await p.locator('#reorder-list').click();}else await p.locator('#order-'+value).click();}
export async function getOrder(p){if(await p.locator('#order-toggle').count())return await p.locator('#order-toggle').textContent()==='123'?'number':'title';for(const v of ['title','number'])if(await p.locator('#order-'+v).getAttribute('aria-pressed')==='true')return v;return 'list';}
