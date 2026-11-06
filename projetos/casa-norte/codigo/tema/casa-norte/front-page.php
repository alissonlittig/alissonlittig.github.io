<?php
/**
 * Home: hero + search, featured listings, neighborhoods, how we work, contact.
 *
 * @package casanorte
 */

get_header();

$featured = new WP_Query( array(
	'post_type'      => 'imovel',
	'posts_per_page' => 3,
	'orderby'        => 'menu_order title',
	'order'          => 'ASC',
	'meta_key'       => 'cn_destaque', // phpcs:ignore WordPress.DB.SlowDBQuery
	'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
) );
$bairros  = get_terms( array( 'taxonomy' => 'bairro', 'hide_empty' => true ) );
?>
<section class="hero">
	<div class="wrap">
		<p class="eyebrow">Curitiba · compra, venda e locação</p>
		<h1>Encontre o lugar certo, <em>sem rodeio</em>.</h1>
		<p class="lead">Imóveis conferidos um a um, com documentação revisada e um corretor que responde de verdade.</p>
		<div class="hero-search"><?php get_template_part( 'template-parts/filtro' ); ?></div>
	</div>
</section>

<section class="section" id="destaques">
	<div class="wrap">
		<p class="eyebrow">Em destaque</p>
		<h2>Seleção da semana</h2>
		<div class="listing-grid">
			<?php
			while ( $featured->have_posts() ) {
				$featured->the_post();
				get_template_part( 'template-parts/card-imovel' );
			}
			wp_reset_postdata();
			?>
		</div>
		<p class="center"><a class="btn btn-ghost" href="<?php echo esc_url( get_post_type_archive_link( 'imovel' ) ); ?>">Ver todos os imóveis</a></p>
	</div>
</section>

<section class="section section-sand" id="bairros">
	<div class="wrap">
		<p class="eyebrow">Bairros</p>
		<h2>Onde a gente mais conhece</h2>
		<ul class="tiles">
			<?php foreach ( $bairros as $b ) : ?>
				<li><a href="<?php echo esc_url( add_query_arg( 'bairro', $b->slug, get_post_type_archive_link( 'imovel' ) ) ); ?>"><strong><?php echo esc_html( $b->name ); ?></strong><span><?php echo esc_html( sprintf( _n( '%d imóvel', '%d imóveis', $b->count, 'casanorte' ), $b->count ) ); ?></span></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>

<section class="section" id="servicos">
	<div class="wrap steps">
		<div>
			<p class="eyebrow">Como atuamos</p>
			<h2>Do primeiro contato às chaves.</h2>
		</div>
		<ol>
			<li><strong>Conversa e perfil</strong><span>Entendemos orçamento, prazo e o que não é negociável.</span></li>
			<li><strong>Visitas organizadas</strong><span>Agrupamos os imóveis por região para você ver vários no mesmo dia.</span></li>
			<li><strong>Documentação revisada</strong><span>Matrícula, certidões e contrato conferidos antes da proposta.</span></li>
			<li><strong>Acompanhamento</strong><span>Seguimos ao seu lado até a entrega das chaves.</span></li>
		</ol>
	</div>
</section>

<?php
get_template_part( 'template-parts/contato' );
get_footer();
